import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Dimensions, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

const TERMS = `ANANTA – Terms of Service
Effective Date: 23 February 2026
Operated by Sparknet Studios
support@anantalive.com | anantalive.com

1. Acceptance of Terms
These Terms of Service ("Terms") constitute a legally binding agreement between you and Sparknet Studios ("we", "us", "our") governing your access to and use of the Ananta live streaming platform, including our mobile application and website (collectively, the "Platform"). By creating an account or using the Platform, you confirm that you have read, understood, and agreed to these Terms and our Privacy Policy.

If you do not agree to these Terms, you must not use the Platform.

2. Eligibility
You must be at least 18 years of age to register and use Ananta. By using the Platform, you represent and warrant that you are 18 years or older and have the legal capacity to enter into a binding agreement. If we discover that a user is under 18, we reserve the right to immediately suspend or terminate their account without prior notice.

3. Account Registration
• You must provide accurate, current, and complete information during registration
• You are responsible for maintaining the confidentiality of your login credentials
• You are responsible for all activities that occur under your account
• You must notify us immediately at support@anantalive.com if you suspect any unauthorised access
• You may not create multiple accounts, transfer your account, or impersonate any individual
• We reserve the right to refuse registration or suspend accounts at our discretion

4. Platform Features

4.1 Live Streaming and Audio Streaming
Ananta allows eligible users to broadcast live video and audio streams. By broadcasting, you grant Ananta a non-exclusive, royalty-free, worldwide licence to display and distribute your content on the Platform. You retain ownership of your original content.

4.2 Coin System and Recharges
Ananta operates a virtual coin economy. Users may purchase coins using real money via UPI and cards processed by Razorpay. Coins have no monetary value outside the Platform, cannot be exchanged for cash by non-creators, and are non-refundable except where required by applicable law.

4.3 Gifting
Users may send virtual gifts to streamers using coins. Gifts represent a voluntary expression of appreciation and do not constitute a payment for services. Sparknet Studios retains a platform fee on all gifts before crediting the remaining value to the streamer's account.

4.4 Creator Withdrawals
Creators who accumulate eligible earnings may withdraw funds subject to:
• Minimum withdrawal threshold as specified in the app
• Completion of KYC verification as required by applicable Indian regulations
• Compliance with all applicable tax obligations — TDS may be deducted as required
• Withdrawal requests are processed within 3–7 business days
• Sparknet Studios reserves the right to withhold withdrawals pending fraud investigation

5. Community Guidelines and Prohibited Conduct
You agree not to use Ananta to:
• Broadcast or share any content that is obscene, pornographic, or harmful to minors
• Harass, bully, threaten, defame, or abuse any other user
• Promote or incite violence, hatred, discrimination, or illegal activity
• Violate any applicable Indian law including the IT Act, 2000
• Infringe the intellectual property rights of any third party
• Engage in fraudulent recharges, self-gifting abuse, or manipulation of the coin economy
• Use bots, scripts, or automated tools to interact with the Platform
• Attempt to reverse-engineer, hack, or disrupt the Platform

6. Content Moderation
Ananta employs both automated tools and human review to monitor content. We reserve the right to remove, restrict, or report any content that violates these Terms. Users may report violating content using the in-app report feature.

7. Intellectual Property
All Platform content created by Sparknet Studios is owned by or licenced to Sparknet Studios. You retain ownership of original content you create on Ananta. By posting content, you grant Sparknet Studios a non-exclusive, royalty-free licence to use, display, and distribute such content solely for operating the Platform.

8. Payments, Refunds, and Disputes
All transactions are processed by Razorpay. Coin purchases are generally non-refundable. Refunds may be considered for:
• Duplicate charges due to a technical error
• Recharge successful but coins not credited within 24 hours

To raise a payment dispute, contact support@anantalive.com with your transaction ID within 7 days.

9. Disclaimers and Limitation of Liability
The Platform is provided on an "as is" and "as available" basis without warranties of any kind. Sparknet Studios shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the Platform.

10. Indemnification
You agree to indemnify and hold harmless Sparknet Studios from any claims, damages, losses, liabilities, costs, and expenses arising out of your use of the Platform or your violation of these Terms.

11. Termination
We may suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or any reason we deem appropriate. You may delete your account at any time through the app settings.

12. Governing Law and Dispute Resolution
These Terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of India.

13. Changes to Terms
Sparknet Studios reserves the right to update these Terms at any time. We will notify users of material changes via in-app notification or email at least 7 days before changes take effect.

14. Contact Us
Email: support@anantalive.com
Website: https://anantalive.com
Operated by: Sparknet Studios, India`;

const PRIVACY = `ANANTA – Privacy Policy
Effective Date: 23 February 2026
Operated by Sparknet Studios
support@anantalive.com | anantalive.com

1. Introduction
Welcome to Ananta, a live streaming and audio streaming platform operated by Sparknet Studios. This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you use the Ananta mobile application or website.

By registering or using Ananta, you agree to the practices described in this Privacy Policy.

2. Who Can Use Ananta
Ananta is strictly intended for users who are 18 years of age or older. We do not knowingly collect personal information from anyone under the age of 18. If you believe a minor has registered, please contact us at support@anantalive.com.

3. Information We Collect

3.1 Information You Provide
• Full name, email address, and phone number during registration
• Profile information such as display name, profile photo, and bio
• Payment information including transaction details processed via Razorpay (we do not store raw card or UPI credentials)
• User-generated content including live video streams, audio streams, messages, comments, and gifts

3.2 Information Collected Automatically
• Device information such as device model, operating system, and unique device identifiers
• IP address and approximate location data derived from your network connection
• Usage data including pages viewed, features used, session duration, and interaction patterns
• Log data including access times, app crashes, and error reports

3.3 Information from Third Parties
• Agora.io: Streaming session metadata for delivering live audio and video
• Razorpay: Payment confirmation and transaction status
• Google Analytics: Aggregated usage statistics and behavioural analytics

4. How We Use Your Information
• To create and manage your Ananta account
• To enable live video and audio streaming features powered by Agora
• To process coin recharges, gift transactions, and creator withdrawals via Razorpay
• To send you transactional notifications
• To monitor Platform activity and enforce our community guidelines
• To analyse usage patterns and improve Platform features
• To respond to your customer support requests
• To comply with applicable Indian laws and regulations

5. Sharing of Your Information
We do not sell your personal information to third parties. We share your data only with:
• Agora.io: To deliver real-time audio and video streaming
• Razorpay: To process payments, recharges, and payouts
• Google Analytics: To understand aggregated Platform usage (data is anonymised)
• Law enforcement or regulatory authorities: When required by applicable Indian law
• Business transfers: In the event of a merger or acquisition

6. Location Data
Ananta collects approximate location data derived from your IP address to personalise content and detect fraudulent activity. We do not collect precise GPS location without your explicit consent.

7. User Generated Content
Content you create on Ananta, including live streams, audio broadcasts, messages, and gifts, may be visible to other users. You are solely responsible for the content you share.

8. Data Retention
We retain your personal data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law.

9. Data Security
We implement industry-standard technical and organisational measures to protect your personal data. These include encrypted data transmission (HTTPS/TLS), access controls, and secure payment processing via Razorpay's PCI-DSS compliant infrastructure.

10. Your Rights
• Access: Request a copy of the personal data we hold about you
• Correction: Request correction of inaccurate or incomplete data
• Deletion: Request deletion of your account and associated data
• Withdrawal of Consent: Withdraw consent to data processing at any time
• Grievance Redressal: Lodge a complaint with our Grievance Officer

To exercise any of these rights, please contact us at support@anantalive.com.

11. Grievance Officer
In accordance with the Information Technology Act, 2000:
Name: Sparknet Studios
Email: support@anantalive.com
Response time: Within 30 days of receiving a grievance

12. Cookies and Tracking
The Ananta web platform uses cookies and similar tracking technologies to maintain sessions, remember preferences, and collect analytics data. You may control cookie preferences through your browser settings.

13. Third Party Links
Ananta may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties.

14. Changes to This Policy
We may update this Privacy Policy from time to time. We will notify you of significant changes via in-app notification or email.

15. Contact Us
Email: support@anantalive.com
Website: https://anantalive.com
Operated by: Sparknet Studios, India`;

export default function TermsScreen() {
  const { isDark } = useTheme();
  const params = useLocalSearchParams();
  const initialTab = params.tab === 'privacy' ? 1 : 0;
  const [activeTab, setActiveTab] = useState(initialTab);

  const accent = isDark ? '#F7C14D' : '#127d96';
  const bg = isDark ? '#000' : '#f8f9fa';
  const cardBg = isDark ? '#1a1a1a' : 'white';
  const textColor = isDark ? '#e0e0e0' : '#333';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: accent }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={isDark ? 'black' : 'white'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? 'black' : 'white' }]}>Legal Documents</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: cardBg }]}>
        {['Terms of Service', 'Privacy Policy'].map((tab, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.tab, activeTab === i && { borderBottomColor: accent, borderBottomWidth: 2.5 }]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, { color: activeTab === i ? accent : (isDark ? '#888' : '#999') }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.body, { color: textColor }]}>
          {activeTab === 0 ? TERMS : PRIVACY}
        </Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: height * 0.06,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 14, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  body: { fontSize: 14, lineHeight: 22 },
});
