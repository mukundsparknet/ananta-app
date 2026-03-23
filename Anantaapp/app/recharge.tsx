import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StatusBar, Dimensions, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

interface RechargePlan {
  id: string | number;
  name: string;
  price: number;
  coins: number;
  popular?: boolean;
}

interface RechargeHistory {
  id: string;
  date: string;
  planName: string;
  amount: number;
  status: 'Success' | 'Failed';
  coinsAdded: number;
}

type PaymentMethod = 'UPI' | 'Card' | 'Wallet';
type RechargeStep = 'plans' | 'payment' | 'order' | 'complete' | 'history';
import { ENV } from '@/config/env';
import RazorpayCheckout from 'react-native-razorpay';

export default function RechargeScreen() {
  const { isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState<RechargeStep>('plans');
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [rechargePlans, setRechargePlans] = useState<RechargePlan[]>([]);
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

  const rechargeHistory: RechargeHistory[] = [];

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch(`${ENV.API_BASE_URL}/api/app/wallet/plans`);
        if (!response.ok) {
          console.error('Failed to fetch plans');
          return;
        }
        const data = await response.json();
        console.log('Plans API response:', data);
        const list: RechargePlan[] = data.plans || [];
        if (Array.isArray(list) && list.length > 0) {
          setRechargePlans(list);
        }
      } catch (e) {
        console.error('Error fetching plans:', e);
      }
    };
    fetchPlans();
  }, []);

  const handlePlanSelect = (plan: RechargePlan) => {
    setSelectedPlan(plan);
  };

  const handleProceedToPayment = () => {
    if (!selectedPlan) return;
    handleCreateRazorpayOrder();
  };

  const handleCreateRazorpayOrder = async () => {
    if (!selectedPlan) return;

    let userId: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      userId = window.localStorage.getItem('userId');
    } else {
      try {
        userId = await SecureStore.getItemAsync('userId');
      } catch { }
    }

    if (!userId) {
      Alert.alert('Error', 'Please login to continue', [
        { text: 'Login', onPress: () => router.push('/auth/login') }
      ]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/api/app/wallet/razorpay/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          planId: selectedPlan.id,
        }),
      });

      if (!response.ok) {
        Alert.alert('Error', 'Failed to create order');
        setLoading(false);
        return;
      }

      const orderData = await response.json();
      openRazorpay(orderData, userId);
    } catch (error) {
      Alert.alert('Error', 'Failed to create order');
      setLoading(false);
    }
  };

  const openRazorpay = (orderData: any, userId: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Ananta App',
        description: `Recharge ${selectedPlan?.coins} coins`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          await verifyPayment(response, userId, orderData.planId, orderData.coins ?? selectedPlan?.coins ?? 0);
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: isDark ? '#f7c14d' : '#127d96'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setLoading(false);
        Alert.alert('Payment Failed', 'Your payment could not be processed.');
      });
      rzp.open();
      setLoading(false);
    } else {
      // Native mobile Razorpay
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Ananta App',
        description: `Recharge ${selectedPlan?.coins} coins`,
        order_id: orderData.orderId,
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: { color: isDark ? '#f7c14d' : '#127d96' }
      };

      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          await verifyPayment(data, userId, orderData.planId, orderData.coins ?? selectedPlan?.coins ?? 0);
        })
        .catch((error: any) => {
          setLoading(false);
          // User cancelled or dismissed — do nothing
        });
    }
  };

  const verifyPayment = async (razorpayResponse: any, userId: string, planId: any, coins: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/api/app/wallet/razorpay/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          userId,
          planId,
        }),
      });

      if (!response.ok) {
        setPaymentSuccess(false);
        setCurrentStep('complete');
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        // Track recharge coins for daily task progress
        const prev = parseFloat(await AsyncStorage.getItem('pendingRechargeCoins') || '0');
        await AsyncStorage.setItem('pendingRechargeCoins', String(prev + (coins ?? 0)));
        setPaymentSuccess(true);
        setCurrentStep('complete');
      } else {
        setPaymentSuccess(false);
        setCurrentStep('complete');
      }
    } catch (error) {
      setPaymentSuccess(false);
      setCurrentStep('complete');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedPlan) return;
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newOrderId = Math.floor(Math.random() * 1000) + 100;
      setOrderId(newOrderId.toString());
      setCurrentStep('order');
    } catch (error) {
      Alert.alert('Error', 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!selectedPlan) return;

    let userId: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      userId = window.localStorage.getItem('userId');
    } else {
      try {
        userId = await SecureStore.getItemAsync('userId');
      } catch { }
    }

    if (!userId) {
      Alert.alert('Error', 'User not identified. Please login again.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/api/app/wallet/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          planId: selectedPlan.id,
        }),
      });

      if (!response.ok) {
        setPaymentSuccess(false);
        setCurrentStep('complete');
        return;
      }

      setPaymentSuccess(true);
      setCurrentStep('complete');
    } catch (error) {
      setPaymentSuccess(false);
      setCurrentStep('complete');
    } finally {
      setLoading(false);
    }
  };

  const renderPlansSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Choose Your Plan</Text>
      
      {rechargePlans.length === 0 ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={isDark ? '#f7c14d' : '#127d96'} />
          <Text style={[{ marginTop: 10, color: isDark ? '#ccc' : '#666' }]}>Loading plans...</Text>
        </View>
      ) : (
        rechargePlans.map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={[
            styles.planCard,
            {
              backgroundColor: isDark ? '#1a1a1a' : 'white',
              borderColor: selectedPlan?.id === plan.id ? (isDark ? '#f7c14d' : '#127d96') : 'transparent',
              borderWidth: selectedPlan?.id === plan.id ? 2 : 0,
            }
          ]}
          onPress={() => handlePlanSelect(plan)}
        >
          {plan.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>POPULAR</Text>
            </View>
          )}
          
          <View style={styles.planContent}>
            <View style={styles.planLeft}>
              <View style={styles.planIconContainer}>
                <Ionicons name="diamond" size={24} color="#B8860B" />
              </View>
              <View style={styles.planInfo}>
                <Text style={[styles.planName, { color: isDark ? 'white' : '#333' }]}>{plan.name}</Text>
                <Text style={[styles.coinText, { color: isDark ? '#ccc' : '#666' }]}>{plan.coins} coins</Text>
              </View>
            </View>
            
            <View style={styles.planRight}>
              <Text style={[styles.planPrice, { color: isDark ? '#f7c14d' : '#127d96' }]}>₹{plan.price}</Text>
              <View style={[
                styles.selectButton,
                {
                  backgroundColor: selectedPlan?.id === plan.id ? (isDark ? '#f7c14d' : '#127d96') : (isDark ? 'rgba(247,193,77,0.1)' : 'rgba(18,125,150,0.1)')
                }
              ]}>
                <Text style={[
                  styles.selectButtonText,
                  { color: selectedPlan?.id === plan.id ? (isDark ? 'black' : 'white') : (isDark ? '#f7c14d' : '#127d96') }
                ]}>
                  {selectedPlan?.id === plan.id ? 'Selected' : 'Select'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))
      )}
      
      {selectedPlan && (
        <TouchableOpacity 
          style={styles.proceedButtonContainer} 
          onPress={handleProceedToPayment}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#ccc', '#999'] : (isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7'])}
            style={styles.proceedButton}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={[styles.proceedButtonText, { color: isDark ? 'black' : 'white' }]}>Proceed to Payment</Text>
                <Ionicons name="arrow-forward" size={20} color={isDark ? 'black' : 'white'} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPaymentSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Payment Method</Text>
      
      {(['UPI', 'Card', 'Wallet'] as PaymentMethod[]).map((method) => (
        <TouchableOpacity
          key={method}
          style={[
            styles.paymentOption,
            { backgroundColor: isDark ? '#1a1a1a' : 'white' }
          ]}
          onPress={() => setPaymentMethod(method)}
        >
          <View style={styles.paymentLeft}>
            <View style={[styles.radioButton, { borderColor: isDark ? '#f7c14d' : '#127d96' }]}>
              <View style={[
                styles.radioInner,
                { backgroundColor: paymentMethod === method ? (isDark ? '#f7c14d' : '#127d96') : 'transparent' }
              ]} />
            </View>
            <Ionicons 
              name={method === 'UPI' ? 'phone-portrait' : method === 'Card' ? 'card' : 'wallet'} 
              size={24} 
              color={isDark ? '#f7c14d' : '#127d96'} 
            />
            <Text style={[styles.paymentText, { color: isDark ? 'white' : '#333' }]}>{method}</Text>
          </View>
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity 
        style={styles.proceedButtonContainer}
        onPress={handleCreateOrder}
        disabled={loading}
      >
        <LinearGradient
          colors={loading ? ['#ccc', '#999'] : (isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7'])}
          style={styles.proceedButton}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={[styles.proceedButtonText, { color: isDark ? 'black' : 'white' }]}>Create Order</Text>
              <Ionicons name="checkmark" size={20} color={isDark ? 'black' : 'white'} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderOrderSection = () => (
    <View style={styles.section}>
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
        </View>
        <Text style={[styles.successTitle, { color: isDark ? 'white' : '#333' }]}>Order Created!</Text>
        
        <View style={[styles.orderCard, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}>
          <Text style={[styles.orderLabel, { color: isDark ? '#ccc' : '#666' }]}>Order Details</Text>
          <Text style={[styles.orderText, { color: isDark ? 'white' : '#333' }]}>Amount: ₹{selectedPlan?.price}</Text>
          <Text style={[styles.orderText, { color: isDark ? 'white' : '#333' }]}>Order ID: {orderId}</Text>
          <Text style={[styles.orderText, { color: isDark ? 'white' : '#333' }]}>Coins: {selectedPlan?.coins}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.proceedButtonContainer}
          onPress={handleCompletePayment}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#ccc', '#999'] : (isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7'])}
            style={styles.proceedButton}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={[styles.proceedButtonText, { color: isDark ? 'black' : 'white' }]}>Complete Payment</Text>
                <Ionicons name="card" size={20} color={isDark ? 'black' : 'white'} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCompleteSection = () => (
    <View style={styles.section}>
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons 
            name={paymentSuccess ? "checkmark-circle" : "close-circle"} 
            size={64} 
            color={paymentSuccess ? "#4CAF50" : "#f44336"} 
          />
        </View>
        <Text style={[styles.successTitle, { color: isDark ? 'white' : '#333' }]}>
          {paymentSuccess ? 'Payment Successful!' : 'Payment Failed'}
        </Text>
        
        {paymentSuccess && (
          <Text style={[styles.coinsAdded, { color: '#4CAF50' }]}>
            {selectedPlan?.coins} coins added to your wallet
          </Text>
        )}
        
        <TouchableOpacity 
          style={styles.proceedButtonContainer}
          onPress={() => paymentSuccess ? router.back() : setCurrentStep('plans')}
        >
          <LinearGradient
            colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']}
            style={styles.proceedButton}
          >
            <Text style={[styles.proceedButtonText, { color: isDark ? 'black' : 'white' }]}>
              {paymentSuccess ? 'Back to Wallet' : 'Try Again'}
            </Text>
            <Ionicons name={paymentSuccess ? "wallet" : "refresh"} size={20} color={isDark ? 'black' : 'white'} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (currentStep) {
      case 'plans': return renderPlansSection();
      case 'complete': return renderCompleteSection();
      default: return renderPlansSection();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Modern Header */}
      <LinearGradient
        colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => {
            if (currentStep === 'plans') {
              router.back();
            } else {
              setCurrentStep('plans');
              setSelectedPlan(null);
              setOrderId(null);
            }
          }}>
            <Ionicons name="arrow-back" size={24} color={isDark ? 'black' : 'white'} />
          </TouchableOpacity>
          
          <View style={styles.logoSection}>
            <Text style={[styles.appTitle, { color: isDark ? 'black' : 'white' }]}>Recharge</Text>
          </View>
          
          <View style={styles.headerActions}>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: height * 0.06,
    paddingBottom: height * 0.025,
    paddingHorizontal: width * 0.05,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  headerActions: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: height * 0.1,
  },
  section: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: '#127d96',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  planIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(184,134,11,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  coinText: {
    fontSize: 14,
  },
  planRight: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  proceedButtonContainer: {
    marginTop: 20,
  },
  proceedButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    gap: 10,
  },
  proceedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentOption: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#127d96',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  paymentText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 15,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  orderCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  orderLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  orderText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  coinsAdded: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 30,
  },

});
