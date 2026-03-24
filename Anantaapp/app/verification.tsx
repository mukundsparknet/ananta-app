import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  Alert, Image, TextInput, Platform, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../contexts/ThemeContext';
import { ENV } from '@/config/env';

const HOST_POLICY_TEXT = `ANANTA
Host Policy
Guidelines and responsibilities for all live hosts on the Ananta platform.
Effective Date: 24 March 2026
Operated by Sparknet Studios
support@anantalive.com  |  anantalive.com

1. Introduction
This Host Policy ("Policy") applies to all users of the Ananta platform who wish to broadcast live video or audio streams ("Hosts"). By activating host status and going live on Ananta, you agree to be bound by this Policy in addition to Ananta's Terms of Service and Privacy Policy.
Ananta is a platform operated by Sparknet Studios that connects live streamers with audiences across India. We are committed to maintaining a safe, respectful, and legally compliant environment for all users. This Policy sets out your rights, responsibilities, and the standards expected of every Host on the platform.
Failure to comply with this Policy may result in earnings being withheld, host privileges being revoked, or your account being permanently banned.

2. Becoming a Host on Ananta
2.1 Eligibility
To become a Host on Ananta, you must meet all of the following requirements:
• Be at least 18 years of age
• Hold a valid, active Ananta user account in good standing
• Successfully complete Ananta's KYC (Know Your Customer) verification process
• Agree to and comply with this Host Policy, the Terms of Service, and Privacy Policy

2.2 KYC Verification
KYC verification is mandatory for all Hosts before going live or receiving earnings. The KYC process requires you to submit the following:
• A valid government-issued photo ID — Aadhaar card, PAN card, Passport, or Voter ID
• A selfie or liveness check for identity confirmation
• Your bank account details or UPI ID for withdrawal purposes
• PAN card details for tax compliance and TDS deduction as applicable under Indian income tax law
KYC documents are reviewed by Sparknet Studios within 2-5 business days. You will be notified via email and in-app notification once your KYC is approved or if additional information is required. Providing false, incomplete, or fraudulent KYC documents will result in immediate permanent ban and may be reported to relevant authorities.

2.3 Host Activation
Once your KYC is verified and approved, your account will be upgraded to Host status. You may then go live using the Ananta app. Ananta reserves the right to revoke host status at any time for violations of this Policy or the Terms of Service.

3. Host Responsibilities
3.1 Stream Environment
As a Host, you are fully responsible for everything that occurs within your live stream. This includes:
• Ensuring your streaming environment is appropriate, well-lit, and free of hazardous or offensive background content
• Ensuring no minors are visible or participating in your live stream in any capacity
• Ensuring no other individuals appear in your stream without their explicit consent
• Ensuring your stream does not take place in a location where broadcasting could be illegal or unsafe

3.2 Content Standards
All content broadcast on Ananta must adhere to the following standards at all times during a live session:
• Content must be suitable for a general adult audience (18+)
• Language must be respectful — excessive profanity, slurs, or hate speech is not permitted
• Hosts must not engage in or encourage any activity that is illegal under Indian law
• Hosts must treat all viewers and co-hosts with dignity and respect
• Hosts must not solicit personal information from viewers including phone numbers, addresses, or financial details

4. Strictly Prohibited Content
The following categories of content are strictly prohibited on Ananta under all circumstances. Broadcasting any of the following will result in immediate stream termination, earnings withholding, and permanent account ban:

4.1 Adult and Sexual Content
• Nudity, partial nudity, or sexually suggestive behaviour of any kind
• Sexually explicit language, sounds, or acts
• Content designed to solicit sexual favours or payments in exchange for sexual content
• Any content that sexualises or exploits individuals

4.2 Political Content
• Campaigning for or against any political party, candidate, or political ideology
• Broadcasting political rallies, speeches, or party propaganda
• Expressing partisan political opinions intended to influence viewers
• Content that could be construed as election interference or voter manipulation
Ananta is a neutral entertainment platform. Discussions of current events are permitted in a neutral and factual manner but must not cross into partisan political advocacy.

4.3 Religious Content
• Content that mocks, disrespects, or attacks any religion, religious community, religious figure, or place of worship
• Content that promotes religious extremism, fundamentalism, or sectarian violence
• Content designed to provoke communal tension or religious discord
• Proselytising or soliciting conversions during a live stream
Hosts may discuss religion respectfully and factually. Content that promotes harmony and understanding across religions is permitted. Content that incites division or disrespect is not.

4.4 Other Prohibited Content
• Violence, gore, self-harm, or content that glorifies or encourages physical harm
• Gambling, betting, or promotion of online gambling platforms
• Promotion, sale, or use of illegal drugs, alcohol to minors, or controlled substances
• Sharing or displaying copyrighted material including songs, films, or shows without proper licencing
• Harassment, stalking, or targeted abuse of any individual viewer or user
• Fake news, misinformation, or content designed to deceive viewers
• Unauthorised promotion or advertising of third-party products or services for personal gain

5. Gifting and Earnings
5.1 Virtual Gifts
Viewers may send virtual gifts to Hosts during live streams using Ananta coins. Gifts are a voluntary expression of appreciation from viewers and do not represent payment for any specific service or act. Hosts must not solicit gifts in exchange for specific content, actions, or promises, as this constitutes a transactional arrangement that violates this Policy.

5.2 Platform Fee
Ananta retains a platform fee from all gifts received by Hosts. The remaining balance after the platform fee is credited to the Host's in-app earnings wallet. The current platform fee percentage is communicated within the app and may be updated with prior notice.

5.3 Earnings Wallet
Earnings credited to your wallet represent your share of gifts received after the platform fee. Earnings accumulate in your in-app wallet and can be withdrawn subject to the conditions in Section 6. Sparknet Studios reserves the right to freeze, withhold, or forfeit earnings in the following circumstances:
• Violation of this Host Policy or the Terms of Service
• Suspected fraudulent activity including self-gifting, coordinated fake gifting, or coin manipulation
• Pending investigation of a complaint or legal inquiry
• Failure to maintain valid KYC or providing false KYC documents
• Account termination due to policy violations

6. Withdrawals
6.1 Eligibility for Withdrawal
To withdraw earnings from your Ananta wallet, you must:
• Have completed and maintained valid KYC verification
• Have a minimum balance meeting the withdrawal threshold as specified in the app
• Have a verified bank account or UPI ID linked to your account
• Not have any active policy violations, account suspensions, or pending investigations

6.2 Withdrawal Process
Withdrawal requests are processed within 3-7 business days via IMPS or UPI to your registered account. Sparknet Studios is not responsible for delays caused by your bank or payment infrastructure. Withdrawals may be subject to TDS deduction as applicable under Indian income tax regulations. It is your sole responsibility to file your income tax returns and declare earnings from Ananta.

6.3 Withheld Earnings
If your earnings are withheld due to a policy violation or investigation, you will be notified via email and in-app notification. Withheld earnings will be reviewed within 15 business days. If the investigation concludes in your favour, earnings will be released. If the investigation confirms a violation, withheld earnings may be forfeited permanently.

7. Stream Moderation and Intervention
Ananta employs automated monitoring tools and human moderators who may observe live streams at any time. In the event that a live stream is found to be in violation of this Policy, Ananta reserves the right to:
• Immediately terminate the live stream without prior notice
• Issue an in-app warning to the Host
• Temporarily or permanently restrict the Host's ability to go live
• Withhold or forfeit the Host's earnings
• Permanently ban the Host's account
• Report the content and Host details to law enforcement authorities if required by Indian law
Moderation decisions are made at the sole discretion of Sparknet Studios. Hosts may appeal a moderation decision by contacting support@anantalive.com within 7 days of the action. Appeals will be reviewed within 15 business days. The decision on appeal is final.

8. Violations and Consequences
8.1 Earnings Withholding
Any confirmed violation of this Policy may result in some or all of your accumulated earnings being withheld. Withheld earnings may be permanently forfeited if the violation is determined to be severe or intentional. Examples of violations leading to earnings withholding include broadcasting prohibited content, fraudulent gifting activity, or providing false KYC information.

8.2 Permanent Ban
The following violations will result in immediate permanent account ban with no possibility of reinstatement:
• Broadcasting adult, sexual, or pornographic content
• Content involving or targeting minors in any harmful manner
• Fraudulent KYC submission or identity impersonation
• Coordinated gifting fraud or coin economy manipulation
• Content that incites violence, communal hatred, or terrorism
• Repeated serious violations following prior warnings or suspensions
A permanently banned Host forfeits all accumulated earnings and coins. The associated device and phone number may also be blocked from creating new accounts on Ananta.

8.3 Reporting Violations to Authorities
Sparknet Studios will cooperate fully with law enforcement and regulatory authorities in India. Any content that constitutes a cognisable offence under Indian law including the Information Technology Act 2000, Indian Penal Code, or POCSO Act will be reported to the appropriate authorities and relevant user data will be shared as required by law.

9. Intellectual Property During Streams
Hosts are responsible for ensuring they have the necessary rights and licences for all content used during a live stream. This includes:
• Background music — you must hold a valid licence or use royalty-free music only
• Films, shows, or video clips — broadcasting copyrighted video content is strictly prohibited
• Third-party logos, brand names, or trademarks — must not be used without authorisation
Ananta may mute or terminate streams where copyrighted content is detected. Repeat violations may result in permanent ban. Ananta is not liable for copyright claims arising from a Host's stream content.

10. Host Conduct Towards Viewers
Hosts are expected to maintain a respectful and positive relationship with their audience. The following conduct towards viewers is prohibited:
• Soliciting personal information such as phone numbers, home addresses, or financial details from viewers
• Pressuring viewers to send gifts, recharge coins, or make payments
• Engaging in romantic or intimate conversations with viewers in a manner designed to exploit emotions or extract money
• Discriminating against viewers based on religion, caste, gender, sexual orientation, or region
• Publicly shaming, mocking, or humiliating any viewer

11. Tax Compliance
All earnings received through Ananta are subject to applicable Indian tax laws. As a Host, you are solely responsible for:
• Declaring your Ananta earnings in your annual income tax return
• Paying applicable income tax on your earnings
• Maintaining records of your earnings and withdrawals for tax purposes
Sparknet Studios will deduct TDS (Tax Deducted at Source) as required under Indian income tax regulations and will provide TDS certificates upon request. Ananta is not responsible for your personal tax filings or liabilities beyond mandatory TDS deduction.

12. Changes to This Policy
Sparknet Studios reserves the right to update or modify this Host Policy at any time. Hosts will be notified of material changes via in-app notification or email at least 7 days before the changes take effect. Continued hosting activity after the effective date of changes constitutes your acceptance of the revised Policy.

13. Contact and Support
For any questions, concerns, or appeals related to this Host Policy, please contact the Ananta support team:
• Email: support@anantalive.com
• Website: https://anantalive.com
• Response time: Within 5 business days
• Operated by: Sparknet Studios, India

SCHEDULE A
Host Earnings Structure — Phase 1 (Starter)
Effective: 24 March 2026  |  Applicable to all verified hosts during Phase 1

A1. Overview
This Schedule forms part of the Ananta Host Policy and sets out the earnings structure applicable to all verified hosts during Phase 1 of the Ananta platform. All hosts who successfully complete KYC verification are automatically enrolled in the Starter tier. This structure will remain in effect until Sparknet Studios communicates a revised structure with at least 7 days prior notice.

A2. Platform Fee Structure
A2.1 Starter Tier — All Verified Hosts
The following fee structure applies to all gift earnings received during live video and audio streams on Ananta:
Platform Deduction: 40% of total gift value received
Host Payout: 60% of total gift value received
The platform deduction of 40% covers the following operational costs incurred by Ananta on behalf of the host:
• Agora HD streaming infrastructure costs (720p video and audio delivery)
• Razorpay payment gateway processing fees on viewer recharges
• Platform server, maintenance, and operational expenses
• Customer support and moderation services
• Platform profit and growth reinvestment
Sparknet Studios does not charge any fixed monthly fee to hosts during Phase 1. The platform deduction is the sole charge applied to gift earnings.

A3. Illustrative Earnings Example
The following example illustrates how earnings are calculated for a host receiving gifts during a live stream session:
• Total gifts received during stream: ₹1,000
• Platform deduction (40%): ₹400
• Host gross earnings (60%): ₹600
• TDS deducted at source (1% of host gross earnings): ₹6
• Host net payout to bank/UPI: ₹594
Note: TDS is deducted as required under Section 194O or applicable provisions of the Indian Income Tax Act. A TDS certificate will be issued to the host for each financial year. Hosts are solely responsible for filing their own income tax returns and declaring total earnings from the platform.

A4. Coin-to-Rupee Conversion
Viewer gifts are sent using Ananta coins. The coin-to-rupee conversion rate used for calculating host earnings is as follows:
• Coin value for host earnings calculation: as published within the Ananta app at the time of the gift
• Ananta reserves the right to revise the coin-to-rupee conversion rate with 7 days prior notice to hosts
• Conversion rates for viewer recharges and host earnings may differ — the applicable rate for host earnings will always be the rate displayed in the host earnings dashboard

A5. Withdrawal Conditions
A5.1 Minimum Withdrawal Threshold
Hosts may submit a withdrawal request once their wallet balance meets the minimum threshold of ₹500. Withdrawal requests below this threshold will not be processed.

A5.2 Processing Timeline
Approved withdrawal requests are processed within 3 to 7 business days via IMPS or UPI transfer to the host's verified bank account or UPI ID registered during KYC. Sparknet Studios is not liable for delays caused by the host's bank or payment infrastructure.

A5.3 Withdrawal Fees
Ananta does not charge any additional fee on withdrawals during Phase 1. The host receives the full net payout amount after platform deduction and TDS as described in Section A3.

A5.4 Withdrawal Holds
Withdrawal requests may be placed on hold in the following circumstances:
• Pending KYC re-verification or expiry of KYC documents
• Active investigation of a policy violation or fraud complaint
• Discrepancy between registered bank details and KYC identity
• Legal hold or regulatory requirement
Hosts will be notified via in-app notification and email if a withdrawal is placed on hold. Sparknet Studios will endeavour to resolve holds within 15 business days.

A6. Future Tier Structure
Sparknet Studios intends to introduce additional earning tiers in future phases of the platform to reward high-performing hosts with improved revenue share. The indicative future structure is as follows — this is provided for transparency only and is not a contractual commitment:
• Starter Tier (Phase 1, current): 40% platform deduction, host keeps 60% — applicable to all hosts
• Growth Tier (future): 35% platform deduction, host keeps 65% — for hosts earning ₹10,000 or more per month
• Star Tier (future): 30% platform deduction, host keeps 70% — for hosts earning ₹50,000 or more per month
Hosts will be automatically upgraded to a higher tier once their monthly earnings meet the applicable threshold. Tier changes will be communicated via in-app notification and will take effect from the first day of the following month.

A7. Changes to Earnings Structure
Sparknet Studios reserves the right to revise the platform fee, tier thresholds, withdrawal minimums, coin conversion rates, or any other aspect of this earnings structure at any time. Hosts will be notified of any changes at least 7 days before they take effect via in-app notification and email. Continued streaming activity after the effective date of a revised structure constitutes acceptance of the revised terms.

A8. Queries on Earnings
For any questions or disputes regarding your earnings, deductions, withdrawals, or TDS certificates, please contact:
• Email: support@anantalive.com
• Subject line: Host Earnings Query — [Your Registered Username]
• Include your transaction ID or withdrawal reference number for faster resolution
• Response time: Within 5 business days`;

export default function VerificationScreen() {
  const { isDark } = useTheme();
  const [selectedDocType, setSelectedDocType] = useState('');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<'NONE' | 'PENDING' | 'APPROVED'>('NONE');
  const [submitting, setSubmitting] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', gender: '', birthday: '', bio: '', documentNumber: '', dateOfBirth: '', address: '' });

  const accentColor = isDark ? '#f7c14d' : '#127d96';
  const accentText = isDark ? 'black' : 'white';

  useEffect(() => {
    const loadUser = async () => {
      let userId: string | null = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        userId = window.localStorage.getItem('userId');
      } else {
        userId = await SecureStore.getItemAsync('userId');
      }
      if (!userId) return;
      try {
        const res = await fetch(`${ENV.API_BASE_URL}/api/app/profile/${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        const kyc = data.kyc;
        const user = data.user;
        if (kyc?.status === 'PENDING') setKycStatus('PENDING');
        if (kyc?.status === 'APPROVED') setKycStatus('APPROVED');
        const base = {
          fullName: user?.fullName || '',
          email: user?.email || '',
          phone: user?.phone || '',
          gender: user?.gender || '',
          birthday: user?.birthday || '',
          bio: user?.bio || '',
          dateOfBirth: user?.birthday || '',
          address: [user?.addressLine1, user?.city, user?.state].filter(Boolean).join(', ') || '',
        };
        if (kyc) {
          setSelectedDocType((kyc.documentType || '').toLowerCase().includes('aadhar') ? 'aadhar' : 'license');
          setFormData(prev => ({ ...prev, ...base, documentNumber: kyc.documentNumber || '' }));
        } else if (user) {
          setFormData(prev => ({ ...prev, ...base }));
        }
      } catch {}
    };
    loadUser();
  }, []);

  const documentTypes = [
    { id: 'aadhar', name: 'Aadhar Card', icon: 'card-outline' as const },
    { id: 'license', name: 'Driving License', icon: 'car-outline' as const },
  ];

  const pickDocument = async (side: 'front' | 'back') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled) {
      if (side === 'front') setFrontImage(result.assets[0].uri);
      else setBackImage(result.assets[0].uri);
    }
  };

  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is needed to take a selfie.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!result.canceled) setSelfieImage(result.assets[0].uri);
  };

  const toBase64 = async (uri: string | null): Promise<string | null> => {
    if (!uri) return null;
    try {
      if (Platform.OS === 'web') {
        const res = await fetch(uri);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
      }
      const FileSystem = require('expo-file-system');
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      return `data:image/jpeg;base64,${base64}`;
    } catch { return null; }
  };

  const submitVerification = async () => {
    if (!selectedDocType || !frontImage || !selfieImage || !formData.fullName || !formData.email || !formData.documentNumber) {
      Alert.alert('Error', 'Please fill all required fields, upload the front document image, and take a selfie');
      return;
    }
    setSubmitting(true);
    try {
      let userId: string | null = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        userId = window.localStorage.getItem('userId');
      } else {
        userId = await SecureStore.getItemAsync('userId');
      }
      if (!userId) { Alert.alert('Error', 'Session expired. Please login again.'); return; }

      const docTypeMap: Record<string, string> = { aadhar: 'Aadhaar Card', license: 'Driving License' };

      const form = new FormData();
      form.append('userId', userId);
      form.append('username', formData.fullName);
      form.append('fullName', formData.fullName);
      form.append('email', formData.email);
      form.append('phone', formData.phone || '');
      form.append('gender', formData.gender || '');
      form.append('birthday', formData.birthday || '');
      form.append('bio', formData.bio || '');
      form.append('documentType', docTypeMap[selectedDocType] || selectedDocType);
      form.append('documentNumber', formData.documentNumber);

      if (frontImage) {
        const filename = frontImage.split('/').pop() || 'front.jpg';
        const match = /\.([a-zA-Z]+)$/.exec(filename);
        const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
        form.append('documentFrontImage', { uri: frontImage, name: filename, type } as any);
      }
      if (backImage) {
        const filename = backImage.split('/').pop() || 'back.jpg';
        const match = /\.([a-zA-Z]+)$/.exec(filename);
        const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
        form.append('documentBackImage', { uri: backImage, name: filename, type } as any);
      }
      if (selfieImage) {
        const filename = selfieImage.split('/').pop() || 'selfie.jpg';
        const match = /\.([a-zA-Z]+)$/.exec(filename);
        const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
        form.append('selfieImage', { uri: selfieImage, name: filename, type } as any);
      }

      const res = await fetch(`${ENV.API_BASE_URL}/api/app/register-multipart`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let msg = 'Submission failed. Try again.';
        try { msg = JSON.parse(text)?.message || text || msg; } catch { msg = text || msg; }
        Alert.alert('Error', msg);
        return;
      }
      setKycStatus('PENDING');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const UploadBox = ({ side, image, onRemove }: { side: 'front' | 'back'; image: string | null; onRemove: () => void }) => (
    <>
      <Text style={[styles.uploadLabel, { color: isDark ? '#ccc' : '#555' }]}>
        {side === 'front' ? 'Front Side *' : 'Back Side'}
      </Text>
      <TouchableOpacity style={styles.uploadArea} onPress={() => pickDocument(side)}>
        {image ? (
          <View style={styles.uploadedContainer}>
            <Image source={{ uri: image }} style={styles.uploadedImage} />
            <TouchableOpacity style={styles.removeOverlay} onPress={onRemove}>
              <Ionicons name="close" size={16} color="white" />
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.uploadPlaceholder, { borderColor: isDark ? '#555' : '#dee2e6', backgroundColor: isDark ? '#333' : '#f8f9fa' }]}>
            <View style={styles.uploadIconCircle}>
              <Ionicons name="cloud-upload-outline" size={36} color={accentColor} />
            </View>
            <Text style={[styles.uploadText, { color: isDark ? '#ccc' : '#666' }]}>Tap to upload {side}</Text>
            <Text style={[styles.uploadSubtext, { color: isDark ? '#888' : '#999' }]}>JPG, PNG (Max 5MB)</Text>
          </View>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}>
      {/* Header */}
      <LinearGradient colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']} style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/profile')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={accentText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: accentText }]}>KYC Verification</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {kycStatus === 'APPROVED' ? (
        /* ── Approved Screen ── */
        <View style={styles.successContainer}>
          <LinearGradient colors={['#38a169', '#48bb78']} style={styles.successIconCircle}>
            <Ionicons name="shield-checkmark" size={64} color="white" />
          </LinearGradient>
          <Text style={[styles.successTitle, { color: isDark ? 'white' : '#1a202c' }]}>KYC Approved!</Text>
          <Text style={[styles.successSubtitle, { color: isDark ? '#aaa' : '#718096' }]}>
            Your identity has been successfully verified.{'\n'}Your account is now fully verified.
          </Text>
          <View style={[styles.pendingBadge, { backgroundColor: isDark ? '#1a2e1a' : '#f0fff4', borderColor: '#38a169' }]}>
            <Ionicons name="checkmark-circle" size={18} color="#38a169" />
            <Text style={[styles.pendingBadgeText, { color: '#38a169' }]}>Verified Account</Text>
          </View>
        </View>
      ) : kycStatus === 'PENDING' ? (
        /* ── Pending Screen ── */
        <View style={styles.successContainer}>
          <LinearGradient colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']} style={styles.successIconCircle}>
            <Ionicons name="checkmark-circle" size={64} color="white" />
          </LinearGradient>
          <Text style={[styles.successTitle, { color: isDark ? 'white' : '#1a202c' }]}>KYC Submitted!</Text>
          <Text style={[styles.successSubtitle, { color: isDark ? '#aaa' : '#718096' }]}>
            Your documents have been submitted successfully.{'\n'}Please wait for admin approval.{'\n'}You will be notified once reviewed.
          </Text>
          <View style={[styles.pendingBadge, { backgroundColor: isDark ? '#333' : '#fef5e7', borderColor: '#ed8936' }]}>
            <Ionicons name="time-outline" size={18} color="#ed8936" />
            <Text style={styles.pendingBadgeText}>Pending Approval</Text>
          </View>
        </View>
      ) : (
        /* ── Form ── */
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* Document Type */}
          <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color={accentColor} />
              <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Select Document Type</Text>
            </View>
            <View style={styles.documentTypes}>
              {documentTypes.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={[styles.docTypeButton, {
                    backgroundColor: selectedDocType === doc.id ? accentColor : (isDark ? '#333' : '#f8f9fa'),
                    borderColor: selectedDocType === doc.id ? accentColor : (isDark ? '#555' : '#dee2e6'),
                  }]}
                  onPress={() => { setSelectedDocType(doc.id); setFrontImage(null); setBackImage(null); }}
                >
                  <Ionicons name={doc.icon} size={20} color={selectedDocType === doc.id ? accentText : accentColor} />
                  <Text style={[styles.docTypeText, { color: selectedDocType === doc.id ? accentText : accentColor }]}>
                    {doc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {selectedDocType !== '' && (
            <>
              {/* Upload Document */}
              <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="cloud-upload" size={20} color={accentColor} />
                  <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Upload Document</Text>
                </View>
                <UploadBox side="front" image={frontImage} onRemove={() => setFrontImage(null)} />
                <View style={{ height: 20 }} />
                <UploadBox side="back" image={backImage} onRemove={() => setBackImage(null)} />
              </View>

              {/* Selfie */}
              <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="camera" size={20} color={accentColor} />
                  <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Selfie Verification *</Text>
                </View>
                <Text style={[{ fontSize: 13, color: isDark ? '#aaa' : '#666', marginBottom: 12 }]}>
                  Take a selfie using your front camera for identity verification.
                </Text>
                {selfieImage ? (
                  <View style={styles.uploadedContainer}>
                    <Image source={{ uri: selfieImage }} style={[styles.uploadedImage, { height: 220, borderRadius: 110, width: 220, alignSelf: 'center' }]} />
                    <TouchableOpacity style={[styles.removeOverlay, { alignSelf: 'center', marginTop: 10, position: 'relative', bottom: 0, right: 0 }]} onPress={() => setSelfieImage(null)}>
                      <Ionicons name="close" size={16} color="white" />
                      <Text style={styles.removeText}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={takeSelfie} style={[styles.uploadPlaceholder, { borderColor: isDark ? '#555' : '#dee2e6', backgroundColor: isDark ? '#333' : '#f8f9fa' }]}>
                    <View style={styles.uploadIconCircle}>
                      <Ionicons name="camera" size={36} color={accentColor} />
                    </View>
                    <Text style={[styles.uploadText, { color: isDark ? '#ccc' : '#666' }]}>Tap to take selfie</Text>
                    <Text style={[styles.uploadSubtext, { color: isDark ? '#888' : '#999' }]}>Front camera • Required</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Document Details */}
              <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="information-circle" size={20} color={accentColor} />
                  <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Document Details</Text>
                </View>
                <View style={styles.form}>
                  {[
                    { icon: 'person' as const, placeholder: 'Full Name *', key: 'fullName' },
                    { icon: 'mail' as const, placeholder: 'Email *', key: 'email' },
                    { icon: 'card' as const, placeholder: `${selectedDocType === 'aadhar' ? 'Aadhar' : 'License'} Number *`, key: 'documentNumber' },
                    { icon: 'calendar' as const, placeholder: 'Date of Birth (DD/MM/YYYY)', key: 'dateOfBirth' },
                    { icon: 'location' as const, placeholder: 'Address', key: 'address' },
                  ].map(({ icon, placeholder, key }) => (
                    <View key={key} style={styles.inputContainer}>
                      <Ionicons name={icon} size={16} color={accentColor} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: isDark ? '#555' : '#dee2e6', color: isDark ? 'white' : '#333' }]}
                        placeholder={placeholder}
                        placeholderTextColor={isDark ? '#888' : '#666'}
                        value={(formData as any)[key]}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, [key]: text }))}
                        multiline={key === 'address'}
                      />
                    </View>
                  ))}
                </View>
              </View>

              {/* Host Policy Agreement */}
              <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => setShowPolicyModal(true)}>
                  <View style={[styles.checkbox, { borderColor: isDark ? '#888' : '#666', backgroundColor: acceptedPolicy ? accentColor : 'transparent' }]}>
                    {acceptedPolicy && <Ionicons name="checkmark" size={16} color={accentText} />}
                  </View>
                  <Text style={[styles.policyText, { color: isDark ? 'white' : '#333' }]}>I agree to the Host Policy</Text>
                </TouchableOpacity>
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitButton, { opacity: (submitting || !acceptedPolicy) ? 0.5 : 1 }]}
                onPress={submitVerification}
                disabled={submitting || !acceptedPolicy}
              >
                <LinearGradient colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']} style={styles.submitGradient}>
                  <Ionicons name="checkmark-circle" size={20} color={accentText} />
                  <Text style={[styles.submitText, { color: accentText }]}>
                    {submitting ? 'Submitting...' : 'Submit for Verification'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Host Policy Modal */}
      <Modal visible={showPolicyModal} transparent animationType="slide" onRequestClose={() => setShowPolicyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.policyModal, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? 'white' : '#333' }]}>Host Policy</Text>
              <TouchableOpacity onPress={() => setShowPolicyModal(false)}>
                <Ionicons name="close" size={24} color={isDark ? 'white' : '#333'} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1, marginVertical: 10 }}>
              <Text style={{ fontSize: 14, lineHeight: 22, color: isDark ? '#ddd' : '#444' }}>{HOST_POLICY_TEXT}</Text>
            </ScrollView>
            <TouchableOpacity
              style={[styles.agreeButton, { backgroundColor: accentColor }]}
              onPress={() => { setAcceptedPolicy(true); setShowPolicyModal(false); }}
            >
              <Text style={{ color: accentText, fontSize: 15, fontWeight: '600' }}>I Agree</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 25, height: 120 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },
  placeholder: { width: 24 },
  content: { flex: 1, paddingTop: 20 },

  // Success
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successIconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 28, elevation: 8 },
  successTitle: { fontSize: 28, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  successSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 28 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, borderWidth: 1.5, marginBottom: 36 },
  pendingBadgeText: { color: '#ed8936', fontWeight: '700', fontSize: 15 },
  backProfileButton: { width: '100%', borderRadius: 25, overflow: 'hidden' },
  backProfileGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  backProfileText: { fontSize: 16, fontWeight: '700' },

  // Form
  section: { marginHorizontal: 20, borderRadius: 20, padding: 25, marginBottom: 20, elevation: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  documentTypes: { flexDirection: 'row', gap: 10 },
  docTypeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 10, borderRadius: 15, borderWidth: 1, elevation: 2 },
  docTypeText: { fontSize: 12, marginLeft: 6, fontWeight: '600' },

  // Upload
  uploadLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  uploadArea: { borderRadius: 15 },
  uploadedContainer: { position: 'relative' },
  uploadedImage: { width: '100%', height: 180, borderRadius: 15 },
  removeOverlay: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  removeText: { color: 'white', fontSize: 12, fontWeight: '600' },
  uploadPlaceholder: { alignItems: 'center', paddingVertical: 40, borderWidth: 2, borderStyle: 'dashed', borderRadius: 15 },
  uploadIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(18,125,150,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  uploadText: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  uploadSubtext: { fontSize: 12 },

  // Form fields
  form: { gap: 15 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  inputIcon: { position: 'absolute', left: 15, zIndex: 1 },
  input: { flex: 1, borderWidth: 1, borderRadius: 15, paddingHorizontal: 45, paddingVertical: 15, fontSize: 16 },

  // Submit
  submitButton: { marginHorizontal: 20, borderRadius: 25, overflow: 'hidden', marginBottom: 10 },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  submitText: { fontSize: 16, fontWeight: 'bold' },

  // Policy
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  policyText: { flex: 1, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  policyModal: { height: '90%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  agreeButton: { borderRadius: 20, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
});
