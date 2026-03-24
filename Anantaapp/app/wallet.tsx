import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Dimensions, Platform, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ENV } from '@/config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

export default function WalletScreen() {
  const { isDark } = useTheme();
  const [balance, setBalance] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [amountText, setAmountText] = useState('');
  const [errorText, setErrorText] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawName, setWithdrawName] = useState('');
  const [withdrawBankName, setWithdrawBankName] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawIfsc, setWithdrawIfsc] = useState('');
  const [withdrawBranch, setWithdrawBranch] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawCoinAmount, setWithdrawCoinAmount] = useState(100);
  const [withdrawRupeeAmount, setWithdrawRupeeAmount] = useState(10);
  const [monthlyEarned, setMonthlyEarned] = useState(0);
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [monthlyTransactionCount, setMonthlyTransactionCount] = useState(0);
  const [kycStatus, setKycStatus] = useState<string>('NONE');
  const [showKycModal, setShowKycModal] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        try {
          let userId: string | null = null;
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            userId = window.localStorage.getItem('userId');
          } else {
            userId = await SecureStore.getItemAsync('userId');
          }
          
          console.log('[Wallet] userId from storage:', userId);
          
          if (!userId) {
            console.log('[Wallet] No userId found');
            return;
          }
          setCurrentUserId(userId);

          try {
            const kycRes = await fetch(`${ENV.API_BASE_URL}/api/app/profile/${userId}`);
            if (kycRes.ok) {
              const kycData = await kycRes.json();
              setKycStatus(kycData.kyc?.status || 'NONE');
            }
          } catch { }

          const fetchWallet = async () => {
            try {
              console.log('[Wallet] Fetching profile for userId:', userId);
              const response = await fetch(`${ENV.API_BASE_URL}/api/app/profile/${userId}`);
              if (!response.ok) {
                console.log('[Wallet] Profile fetch failed:', response.status);
                return;
              }
              const data = await response.json();
              console.log('[Wallet] Profile data:', data);
              const value = typeof data.coins === 'number' ? data.coins : Number(data.coins) || 0;
              console.log('[Wallet] Setting balance to:', value);
              setBalance(value);
            } catch (e) {
              console.error('[Wallet] Error fetching wallet:', e);
            }
          };
          await fetchWallet();
          
          const fetchTransactions = async () => {
            try {
              setLoadingTransactions(true);
              const response = await fetch(`${ENV.API_BASE_URL}/api/app/wallet/${userId}/transactions`);
              if (!response.ok) {
                setLoadingTransactions(false);
                return;
              }
              const data = await response.json();
              if (Array.isArray(data)) {
                setTransactions(data);
                
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                
                let earned = 0;
                let spent = 0;
                let count = 0;
                
                data.forEach((tx: any) => {
                  if (tx.createdAt) {
                    const txDate = new Date(tx.createdAt);
                    if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
                      count++;
                      const amount = typeof tx.amount === 'number' ? tx.amount : Number(tx.amount) || 0;
                      if (tx.credit) {
                        earned += amount;
                      } else {
                        spent += amount;
                      }
                    }
                  }
                });
                
                setMonthlyEarned(earned);
                setMonthlySpent(spent);
                setMonthlyTransactionCount(count);
              }
              setLoadingTransactions(false);
            } catch (e) {
              setLoadingTransactions(false);
            }
          };
          await fetchTransactions();
          
          const fetchWithdrawConfig = async () => {
            try {
              const response = await fetch(`${ENV.API_BASE_URL}/api/app/wallet/withdraw-config`);
              if (!response.ok) {
                return;
              }
              const data = await response.json();
              if (typeof data.coinAmount === 'number') {
                setWithdrawCoinAmount(data.coinAmount);
              }
              if (typeof data.rupeeAmount === 'number') {
                setWithdrawRupeeAmount(data.rupeeAmount);
              }
            } catch (e) {
            }
          };
          await fetchWithdrawConfig();
        } catch (error) {
          console.error('[Wallet] Error in loadData:', error);
        }
      };
      
      loadData();
    }, [])
  );

  const openSendPopup = async () => {
    if (!currentUserId) return;
    if (kycStatus !== 'APPROVED') { setShowKycModal(true); return; }
    try {
      const [followersRes, followingRes] = await Promise.all([
        fetch(`${ENV.API_BASE_URL}/api/app/followers/${currentUserId}`),
        fetch(`${ENV.API_BASE_URL}/api/app/following/${currentUserId}`),
      ]);
      const followersJson = followersRes.ok ? await followersRes.json() : [];
      const followingJson = followingRes.ok ? await followingRes.json() : [];
      const combinedRaw = [...followersJson, ...followingJson];
      const seen: Record<string, boolean> = {};
      const combined: any[] = [];
      combinedRaw.forEach((item: any) => {
        const userId = String(item.userId);
        if (!seen[userId]) {
          seen[userId] = true;
          combined.push({
            userId,
            name: item.fullName || item.username || 'User',
            username: item.username ? `@${item.username}` : '@user',
          });
        }
      });
      setContacts(combined);
      setSelectedUser(null);
      setAmountText('');
      setErrorText('');
      setSending(true);
    } catch {
    }
  };

  const openWithdrawPopup = () => {
    if (!currentUserId) return;
    if (kycStatus !== 'APPROVED') { setShowKycModal(true); return; }
    setWithdrawAmount('');
    setWithdrawName('');
    setWithdrawBankName('');
    setWithdrawAccountNumber('');
    setWithdrawIfsc('');
    setWithdrawBranch('');
    setSubmittingWithdraw(false);
    setWithdrawError('');
    setWithdrawing(true);
  };

  const handleSubmitWithdraw = async () => {
    if (!currentUserId) {
      return;
    }
    const amount = Number(withdrawAmount);
    if (!withdrawAmount || Number.isNaN(amount) || amount <= 0) {
      setWithdrawError('Enter valid amount');
      return;
    }
    if (amount < 500) {
      setWithdrawError('Minimum withdrawal amount is ₹500');
      return;
    }
    const maxRupees = getMaxWithdrawRupees();
    if (amount > maxRupees) {
      setWithdrawError('Insufficient balance to withdraw');
      return;
    }
    if (!withdrawName || !withdrawBankName || !withdrawAccountNumber || !withdrawIfsc || !withdrawBranch) {
      return;
    }
    try {
      setSubmittingWithdraw(true);
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          amount,
          accountHolderName: withdrawName,
          bankName: withdrawBankName,
          accountNumber: withdrawAccountNumber,
          ifscCode: withdrawIfsc,
          branchName: withdrawBranch,
        }),
      });
      if (!res.ok) {
        setSubmittingWithdraw(false);
        setWithdrawError('Insufficient balance to withdraw');
        return;
      }
      const data = await res.json();
      if (typeof data.balance === 'number') {
        setBalance(data.balance);
      }
      setWithdrawing(false);
    } catch {
      setSubmittingWithdraw(false);
    }
  };

  const getCoinToRupeeRate = () => {
    if (!withdrawCoinAmount || !withdrawRupeeAmount) {
      return 0.5;
    }
    return withdrawRupeeAmount / withdrawCoinAmount;
  };

  const getMaxWithdrawRupees = () => {
    const rate = getCoinToRupeeRate();
    return balance * rate;
  };

  const handleConfirmSend = async () => {
    if (!currentUserId || !selectedUser) {
      return;
    }
    const amount = Number(amountText);
    if (!amount || amount <= 0) {
      setErrorText('Enter a valid amount');
      return;
    }
    if (amount > balance) {
      setErrorText('Amount greater than available balance');
      return;
    }
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/wallet/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromUserId: currentUserId,
          toUserId: selectedUser.userId,
          amount,
        }),
      });
      if (!res.ok) {
        setErrorText('Transfer failed');
        return;
      }
      const data = await res.json();
      if (typeof data.fromBalance === 'number') {
        setBalance(data.fromBalance);
      }
      setSending(false);
    } catch {
      setErrorText('Transfer failed');
    }
  };

  const getTransactionIcon = (credit: boolean) => {
    return credit ? 'add-circle' : 'remove-circle';
  };

  const getTransactionColor = (credit: boolean) => {
    return credit ? '#4CAF50' : '#f44336';
  };

  const formatTransactionTitle = (tx: any) => {
    if (tx.note) {
      return tx.note;
    }
    if (tx.type === 'RECHARGE') return 'Recharge';
    if (tx.type === 'GIFT_SENT') return 'Gift sent';
    if (tx.type === 'GIFT_RECEIVED') return 'Gift received';
    if (tx.type === 'TRANSFER_SENT') return 'Coins sent';
    if (tx.type === 'TRANSFER_RECEIVED') return 'Coins received';
    return tx.type || 'Transaction';
  };

  const formatTransactionDate = (value: any) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {/* Modern Header */}
      <LinearGradient
        colors={isDark ? ['#F7C14D', '#F7C14D'] : ['#127d96', '#15a3c7']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? 'black' : 'white'} />
          </TouchableOpacity>
          
          <View style={styles.logoSection}>
            <Text style={[styles.appTitle, { color: isDark ? 'black' : 'white' }]}>My Wallet</Text>
          </View>
          
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/recharge')}>
            <Ionicons name="add" size={24} color={isDark ? 'black' : 'white'} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* KYC Modal */}
      <Modal visible={showKycModal} transparent animationType="fade" onRequestClose={() => setShowKycModal(false)}>
        <View style={styles.kycModalOverlay}>
          <View style={[styles.kycModalBox, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
            <View style={styles.kycModalIcon}>
              <Ionicons name="shield-outline" size={40} color="#ed8936" />
            </View>
            <Text style={[styles.kycModalTitle, { color: isDark ? 'white' : '#1a202c' }]}>KYC Not Approved</Text>
            <Text style={[styles.kycModalDesc, { color: isDark ? '#aaa' : '#718096' }]}>
              You need to complete KYC verification to use this feature.
            </Text>
            <TouchableOpacity style={styles.kycModalBtn} onPress={() => { setShowKycModal(false); router.push('/verification'); }}>
              <LinearGradient colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']} style={styles.kycModalBtnGradient}>
                <Ionicons name="shield-checkmark" size={18} color={isDark ? 'black' : 'white'} />
                <Text style={[styles.kycModalBtnText, { color: isDark ? 'black' : 'white' }]}>Complete KYC</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowKycModal(false)}>
              <Text style={[styles.kycModalCancel, { color: isDark ? '#888' : '#aaa' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <LinearGradient
          colors={isDark ? ['#F7C14D', '#E6B143', '#D4A03A'] : ['#127d96', '#0a5d75', '#083d4f']}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <Ionicons name="diamond" size={32} color={isDark ? 'black' : 'white'} />
            <Text style={[styles.balanceLabel, { color: isDark ? 'rgba(0,0,0,0.8)' : 'white' }]}>Total Balance</Text>
          </View>
          <Text style={[styles.balanceAmount, { color: isDark ? 'black' : 'white' }]}>{balance.toLocaleString()} Coins</Text>
          <Text style={[styles.balanceSubtext, { color: isDark ? 'rgba(0,0,0,0.7)' : 'white' }]}>≈ ₹{(balance * getCoinToRupeeRate()).toFixed(2)}</Text>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}
            onPress={() => router.push('/recharge')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="add-circle" size={24} color="#4CAF50" />
            </View>
            <Text style={[styles.actionText, { color: isDark ? 'white' : '#333' }]}>Recharge</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}
            onPress={openSendPopup}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="send" size={24} color="#2196F3" />
            </View>
            <Text style={[styles.actionText, { color: isDark ? 'white' : '#333' }]}>Send</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}
            onPress={openWithdrawPopup}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="card" size={24} color="#FF9800" />
            </View>
            <Text style={[styles.actionText, { color: isDark ? 'white' : '#333' }]}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Stats */}
        <View style={[styles.statsCard, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}>
          <Text style={[styles.statsTitle, { color: isDark ? 'white' : '#333' }]}>This Month</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>+{monthlyEarned.toLocaleString()}</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>Earned</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#f44336' }]}>-{monthlySpent.toLocaleString()}</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>Spent</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: isDark ? '#F7C14D' : '#127d96' }]}>{monthlyTransactionCount}</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>Transactions</Text>
            </View>
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={[styles.viewAllText, { color: isDark ? '#F7C14D' : '#127d96' }]}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {loadingTransactions ? (
            <Text style={[styles.transactionDate, { color: isDark ? '#888' : '#666' }]}>
              Loading...
            </Text>
          ) : transactions.length === 0 ? (
            <Text style={[styles.transactionDate, { color: isDark ? '#888' : '#666' }]}>
              No recent transactions
            </Text>
          ) : (
            transactions.map((tx: any) => {
              const amount = typeof tx.amount === 'number' ? tx.amount : Number(tx.amount) || 0;
              const credit = !!tx.credit;
              return (
                <TouchableOpacity
                  key={tx.id}
                  style={[styles.transactionItem, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}
                >
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.transactionIcon,
                        { backgroundColor: getTransactionColor(credit) + '20' },
                      ]}
                    >
                      <Ionicons 
                        name={getTransactionIcon(credit)} 
                        size={20} 
                        color={getTransactionColor(credit)} 
                      />
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={[styles.transactionDescription, { color: isDark ? 'white' : '#333' }]}>
                        {formatTransactionTitle(tx)}
                      </Text>
                      <Text style={[styles.transactionDate, { color: isDark ? '#888' : '#666' }]}>
                        {formatTransactionDate(tx.createdAt)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        { color: getTransactionColor(credit) },
                      ]}
                    >
                      {credit ? '+' : '-'}
                      {amount}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
      <Modal
        visible={sending}
        transparent
        animationType="fade"
        onRequestClose={() => setSending(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? 'white' : '#333' }]}>
              Send coins
            </Text>
            {!selectedUser && (
              <ScrollView style={styles.modalList}>
                {contacts.map(item => (
                  <TouchableOpacity
                    key={item.userId}
                    style={styles.modalUserItem}
                    onPress={() => {
                      setSelectedUser(item);
                      setErrorText('');
                    }}
                  >
                    <Text style={[styles.modalUserName, { color: isDark ? 'white' : '#333' }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.modalUserUsername, { color: isDark ? '#aaa' : '#666' }]}>
                      {item.username}
                    </Text>
                  </TouchableOpacity>
                ))}
                {contacts.length === 0 && (
                  <Text style={[styles.modalEmptyText, { color: isDark ? '#777' : '#999' }]}>
                    No followers or following users found.
                  </Text>
                )}
              </ScrollView>
            )}
            {selectedUser && (
              <View>
                <Text style={[styles.modalLabel, { color: isDark ? '#ccc' : '#555' }]}>
                  To: {selectedUser.name} ({selectedUser.username})
                </Text>
                <Text style={[styles.modalBalance, { color: isDark ? '#f7c14d' : '#127d96' }]}>
                  Available: {balance} coins
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      color: isDark ? 'white' : '#333',
                      borderColor: isDark ? '#444' : '#ccc',
                      backgroundColor: isDark ? '#111' : '#f4f4f4',
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor={isDark ? '#777' : '#999'}
                  value={amountText}
                  onChangeText={text => {
                    setAmountText(text);
                    setErrorText('');
                  }}
                />
                {errorText ? (
                  <Text style={styles.modalError}>{errorText}</Text>
                ) : null}
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: isDark ? '#333' : '#ddd' }]}
                    onPress={() => setSending(false)}
                  >
                    <Text style={[styles.modalButtonText, { color: isDark ? 'white' : '#333' }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#127d96' }]}
                    onPress={handleConfirmSend}
                  >
                    <Text style={[styles.modalButtonText, { color: 'white' }]}>
                      Send
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={withdrawing}
        transparent
        animationType="fade"
        onRequestClose={() => setWithdrawing(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? 'white' : '#333' }]}>
              Withdraw
            </Text>
            <ScrollView style={styles.modalList}>
              <Text style={[styles.modalLabel, { color: isDark ? '#ccc' : '#555' }]}>
                Amount (₹)
              </Text>
              <Text style={[styles.modalBalance, { color: isDark ? '#f7c14d' : '#127d96', marginBottom: 4 }]}>
                Rate: {withdrawCoinAmount} coins = ₹{withdrawRupeeAmount}
              </Text>
              <Text style={[styles.modalBalance, { color: isDark ? '#ccc' : '#555', marginBottom: 8 }]}>
                Available for withdraw: ₹{getMaxWithdrawRupees().toFixed(2)}
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: isDark ? 'white' : '#333',
                    borderColor: withdrawError ? '#e53e3e' : isDark ? '#444' : '#ccc',
                    backgroundColor: isDark ? '#111' : '#f4f4f4',
                  },
                ]}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={withdrawError ? '#e53e3e' : isDark ? '#777' : '#999'}
                value={withdrawAmount}
                onChangeText={text => {
                  setWithdrawAmount(text);
                  setWithdrawError('');
                }}
              />
              {withdrawError ? (
                <Text style={styles.modalError}>{withdrawError}</Text>
              ) : null}
              <Text style={[styles.modalLabel, { color: isDark ? '#ccc' : '#555' }]}>
                Name
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: isDark ? 'white' : '#333',
                    borderColor: isDark ? '#444' : '#ccc',
                    backgroundColor: isDark ? '#111' : '#f4f4f4',
                  },
                ]}
                placeholder="Account holder name"
                placeholderTextColor={isDark ? '#777' : '#999'}
                value={withdrawName}
                onChangeText={setWithdrawName}
              />
              <Text style={[styles.modalLabel, { color: isDark ? '#ccc' : '#555' }]}>
                Bank name
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: isDark ? 'white' : '#333',
                    borderColor: isDark ? '#444' : '#ccc',
                    backgroundColor: isDark ? '#111' : '#f4f4f4',
                  },
                ]}
                placeholder="Bank name"
                placeholderTextColor={isDark ? '#777' : '#999'}
                value={withdrawBankName}
                onChangeText={setWithdrawBankName}
              />
              <Text style={[styles.modalLabel, { color: isDark ? '#ccc' : '#555' }]}>
                Account number
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: isDark ? 'white' : '#333',
                    borderColor: isDark ? '#444' : '#ccc',
                    backgroundColor: isDark ? '#111' : '#f4f4f4',
                  },
                ]}
                keyboardType="number-pad"
                placeholder="Account number"
                placeholderTextColor={isDark ? '#777' : '#999'}
                value={withdrawAccountNumber}
                onChangeText={setWithdrawAccountNumber}
              />
              <Text style={[styles.modalLabel, { color: isDark ? '#ccc' : '#555' }]}>
                IFSC code
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: isDark ? 'white' : '#333',
                    borderColor: isDark ? '#444' : '#ccc',
                    backgroundColor: isDark ? '#111' : '#f4f4f4',
                  },
                ]}
                autoCapitalize="characters"
                placeholder="IFSC code"
                placeholderTextColor={isDark ? '#777' : '#999'}
                value={withdrawIfsc}
                onChangeText={setWithdrawIfsc}
              />
              <Text style={[styles.modalLabel, { color: isDark ? '#ccc' : '#555' }]}>
                Branch
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: isDark ? 'white' : '#333',
                    borderColor: isDark ? '#444' : '#ccc',
                    backgroundColor: isDark ? '#111' : '#f4f4f4',
                  },
                ]}
                placeholder="Branch name"
                placeholderTextColor={isDark ? '#777' : '#999'}
                value={withdrawBranch}
                onChangeText={setWithdrawBranch}
              />
            </ScrollView>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: isDark ? '#333' : '#ddd' }]}
                onPress={() => setWithdrawing(false)}
              >
                <Text style={[styles.modalButtonText, { color: isDark ? 'white' : '#333' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#127d96' }]}
                onPress={handleSubmitWithdraw}
                disabled={submittingWithdraw}
              >
                {submittingWithdraw ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>
                    Submit
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: height * 0.1,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    color: 'white',
    fontSize: 16,
    marginLeft: 12,
    opacity: 0.9,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceSubtext: {
    color: 'white',
    fontSize: 16,
    opacity: 0.8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 15,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(247,193,77,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F7C14D',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  statsCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalList: {
    maxHeight: height * 0.5,
  },
  modalUserItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalUserName: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalUserUsername: {
    fontSize: 12,
  },
  modalEmptyText: {
    fontSize: 13,
    paddingVertical: 8,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  modalBalance: {
    fontSize: 13,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 6,
  },
  modalError: {
    fontSize: 12,
    color: '#f44336',
    marginBottom: 8,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 10,
  },
  modalButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  kycModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  kycModalBox: { width: '100%', borderRadius: 24, padding: 32, alignItems: 'center', elevation: 10 },
  kycModalIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fef5e7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  kycModalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  kycModalDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  kycModalBtn: { width: '100%', borderRadius: 25, overflow: 'hidden', marginBottom: 14 },
  kycModalBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  kycModalBtnText: { fontSize: 16, fontWeight: '700' },
  kycModalCancel: { fontSize: 14, fontWeight: '500' },
});
