import React, { useState, useEffect } from "react";
import QRCode from "react-native-qrcode-svg";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
  Modal,
  Animated,
} from "react-native";
import { Alert } from "../components/CustomAlert";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import { Paths } from "expo-file-system";
import { copyAsync, deleteAsync } from "expo-file-system/legacy";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  ArrowLeft,
  Pencil,
  Camera,
  Calendar,
  Briefcase,
  GraduationCap,
  Heart,
  User,
  MapPin,
  X,
  Lock,
} from "lucide-react-native";
import { storage } from "../store/storage";
import { UserProfile } from "../types";
import { getStreakLevel, getStreakLevelImage, getStreakLevelInfo } from "../utils/streak";
import { MASCOT_LIST } from "../utils/mascot";
import { NAVY, styles } from "../styles/ProfileScreen";

const SOCIAL_ICONS = {
  facebook: require("../../assets/common_icons/facebook.png"),
  youtube: require("../../assets/common_icons/youtube.png"),
  tiktok: require("../../assets/common_icons/tik-tok.png"),
  instagram: require("../../assets/common_icons/instagram.png"),
  thread: require("../../assets/common_icons/thread.png"),
};


const ProfileScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [joinDateDisplay, setJoinDateDisplay] = useState("");
  const [daysSinceJoin, setDaysSinceJoin] = useState<number | null>(null);
  const [isMascotModalVisible, setMascotModalVisible] = useState(false);
  const [qrModal, setQrModal] = useState<{ visible: boolean; url: string; label: string }>(
    { visible: false, url: "", label: "" }
  );

  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.25,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const MASCOT_COOLDOWN_DAYS = 20;

  const handleSelectMascot = async (mascotKey: string) => {
    if (!profile) return;

    // Kiểm tra cooldown 20 ngày kể từ lần đổi linh vật gần nhất
    if (profile.mascotLastChanged) {
      const now = Date.now();
      const daysSinceChange = Math.floor(
        (now - profile.mascotLastChanged) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceChange < MASCOT_COOLDOWN_DAYS) {
        const daysLeft = MASCOT_COOLDOWN_DAYS - daysSinceChange;
        setMascotModalVisible(false);
        Alert.alert(
          "Chưa đến lúc đổi linh vật",
          `Bạn vừa đổi linh vật ${daysSinceChange} ngày trước. Còn ${daysLeft} ngày nữa mới được đổi lại.`
        );
        return;
      }
    }

    const updatedProfile = {
      ...profile,
      mascot: mascotKey,
      mascotLastChanged: Date.now(),
    };
    const success = await storage.saveUserProfile(updatedProfile);
    if (success) {
      setProfile(updatedProfile);
      setMascotModalVisible(false);
      Alert.alert("Thành công", "Đã cập nhật linh vật mới!");
    } else {
      Alert.alert("Lỗi", "Không thể lưu linh vật.");
    }
  };

  // Edit form states
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editJob, setEditJob] = useState("");
  const [editEducation, setEditEducation] = useState("");
  const [editHobby, setEditHobby] = useState("");
  // Birthday date picker
  const [birthdayDate, setBirthdayDate] = useState<Date>(new Date(2002, 0, 1));
  const [editBirthday, setEditBirthday] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editGender, setEditGender] = useState("Riêng tư");
  const [editFacebook, setEditFacebook] = useState("");
  const [editYoutube, setEditYoutube] = useState("");
  const [editTiktok, setEditTiktok] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editThread, setEditThread] = useState("");
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (isFocused) loadProfile();
  }, [isFocused]);

  const formatDateVN = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  const loadProfile = async () => {
    const p = await storage.getUserProfile();
    setProfile(p);
    // Auto-fetch join date from "Số dư đầu tiên" transaction
    try {
      const txs = await storage.getTransactions();
      const firstTx = txs.find((t) => t.name === "Số dư đầu tiên");
      if (firstTx) {
        const joinMs = firstTx.timestamp;
        const joinD = new Date(joinMs);
        const formatted = formatDateVN(joinD);
        setJoinDateDisplay(formatted);

        const joinDZero = new Date(
          joinD.getFullYear(),
          joinD.getMonth(),
          joinD.getDate(),
        );
        const today = new Date();
        const todayZero = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        );

        const diff =
          Math.floor(
            (todayZero.getTime() - joinDZero.getTime()) / (1000 * 60 * 60 * 24),
          ) + 1;
        setDaysSinceJoin(diff);
      } else if (p?.joinDate) {
        setJoinDateDisplay(p.joinDate);
        const parts = p.joinDate.split("/");
        if (parts.length === 3) {
          const joinD = new Date(
            parseInt(parts[2]),
            parseInt(parts[1]) - 1,
            parseInt(parts[0]),
          );
          const joinDZero = new Date(
            joinD.getFullYear(),
            joinD.getMonth(),
            joinD.getDate(),
          );
          const today = new Date();
          const todayZero = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
          );
          const diff =
            Math.floor(
              (todayZero.getTime() - joinDZero.getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1;
          setDaysSinceJoin(diff);
        }
      }
    } catch {
      if (p?.joinDate) {
        setJoinDateDisplay(p.joinDate);
        const parts = p.joinDate.split("/");
        if (parts.length === 3) {
          const joinD = new Date(
            parseInt(parts[2]),
            parseInt(parts[1]) - 1,
            parseInt(parts[0]),
          );
          const joinDZero = new Date(
            joinD.getFullYear(),
            joinD.getMonth(),
            joinD.getDate(),
          );
          const today = new Date();
          const todayZero = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
          );
          const diff =
            Math.floor(
              (todayZero.getTime() - joinDZero.getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1;
          setDaysSinceJoin(diff);
        }
      }
    }
  };

  const openEditModal = () => {
    if (!profile) return;
    setEditName(profile.name || "");
    setEditAvatar(profile.avatar || "");
    setEditNickname(profile.nickname || "");
    setEditBio(profile.bio || "");
    setEditJob(profile.job || "");
    setEditEducation(profile.education || "");
    setEditHobby(profile.hobby || "");
    // Parse existing birthday string → Date
    if (profile.birthday) {
      const parts = profile.birthday.split("/");
      if (parts.length === 3) {
        const d = new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0]),
        );
        setBirthdayDate(d);
        setEditBirthday(profile.birthday);
      } else {
        setEditBirthday(profile.birthday);
      }
    } else {
      const defaultDate = new Date(2002, 0, 1);
      setBirthdayDate(defaultDate);
      setEditBirthday("");
    }
    setEditGender(profile.gender || "Riêng tư");
    setEditFacebook(profile.facebook || "");
    setEditYoutube(profile.youtube || "");
    setEditTiktok(profile.tiktok || "");
    setEditInstagram(profile.instagram || "");
    setEditThread(profile.thread || "");
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    if (!editName.trim()) {
      Alert.alert("Lỗi", "Họ và tên không được để trống.");
      return;
    }

    let newHistory = profile.avatarHistory ? [...profile.avatarHistory] : [];
    const newAvatar = editAvatar.trim();

    if (newAvatar && newAvatar !== profile.avatar) {
      newHistory = newHistory.filter((uri) => uri !== newAvatar);
      newHistory.unshift(newAvatar);

      while (newHistory.length > 10) {
        const oldestUri = newHistory.pop();
        if (oldestUri && oldestUri.startsWith("file://")) {
          try {
            await deleteAsync(oldestUri, { idempotent: true });
          } catch (err) {
            console.log("Error deleting oldest history avatar:", err);
          }
        }
      }
    }

    const updatedProfile: UserProfile = {
      ...profile,
      name: editName.trim(),
      avatar: newAvatar,
      avatarHistory: newHistory,
      nickname: editNickname.trim(),
      bio: editBio.trim(),
      job: editJob.trim(),
      education: editEducation.trim(),
      hobby: editHobby.trim(),
      birthday: editBirthday.trim(),
      gender: editGender,
      // joinDate is auto-derived, do not override
      facebook: editFacebook.trim(),
      youtube: editYoutube.trim(),
      tiktok: editTiktok.trim(),
      instagram: editInstagram.trim(),
      thread: editThread.trim(),
    };
    const success = await storage.saveUserProfile(updatedProfile);
    if (success) {
      setProfile(updatedProfile);
      setEditModalVisible(false);
    } else {
      Alert.alert("Lỗi", "Không thể lưu thông tin.");
    }
  };

  const handlePickAvatar = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        const fileName = `avatar_${Date.now()}.jpg`;
        const baseDir = Paths.document?.uri || Paths.cache?.uri || "";
        const permanentUri = `${baseDir}${baseDir.endsWith("/") ? "" : "/"}${fileName}`;
        await copyAsync({
          from: pickedUri,
          to: permanentUri,
        });
        setEditAvatar(permanentUri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", "Không thể mở thư viện ảnh.");
    }
  };

  const handleDeleteHistoryImage = async (uriToDelete: string) => {
    if (!profile) return;
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa ảnh này khỏi lịch sử không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            if (uriToDelete.startsWith("file://")) {
              try {
                await deleteAsync(uriToDelete, { idempotent: true });
              } catch (err) {
                console.log("Error deleting history image file:", err);
              }
            }
            const updatedHistory = (profile.avatarHistory || []).filter(
              (uri) => uri !== uriToDelete,
            );
            const updatedProfile = {
              ...profile,
              avatarHistory: updatedHistory,
            };
            if (editAvatar === uriToDelete) {
              setEditAvatar(profile.avatar || "");
            }
            const success = await storage.saveUserProfile(updatedProfile);
            if (success) {
              setProfile(updatedProfile);
            }
            setPreviewImageUri(null);
          },
        },
      ],
    );
  };

  const hasSocial =
    profile?.facebook ||
    profile?.instagram ||
    profile?.tiktok ||
    profile?.youtube ||
    profile?.thread;

  // ─── VIEW MODE ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <ArrowLeft color="#fff" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        <TouchableOpacity onPress={openEditModal} style={styles.headerBtn}>
          <Pencil color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero Card ── */}
        <View style={styles.heroCard}>
          {/* Background strip */}
          <View style={styles.heroBanner} />

          {/* Avatar */}
          <View style={styles.avatarRing}>
            {profile?.avatar ? (
              <Image
                source={{ uri: profile.avatar }}
                style={styles.avatarImg}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
            )}
          </View>

          {/* Name & bio */}
          <Text style={styles.heroName} numberOfLines={1} ellipsizeMode="tail">{profile?.name || "—"}</Text>
          {profile?.nickname ? (
            <Text style={styles.heroNickname}>@{profile.nickname}</Text>
          ) : <Text style={styles.heroNickname}>@nickname</Text>}
          {profile?.bio ? (
            <Text style={styles.heroBio}>{profile.bio}</Text>
          ) : (
            <Text style={styles.heroBio}>Có gì đó ở đây!</Text>
          )}

          {/* Days since joining badge */}
          {daysSinceJoin !== null ? (
            <View style={styles.daysBadge}>
              <Text style={styles.daysBadgeText}>
                🗓 Đã tham gia {daysSinceJoin.toLocaleString("vi-VN")} ngày
              </Text>
            </View>
          ) : null}

          {/* Social icons decoration */}
          {hasSocial ? (
            <View style={styles.socialStrip}>
              {profile?.facebook ? (
                <TouchableOpacity
                  onPress={() => setQrModal({ visible: true, url: profile.facebook!, label: "Facebook" })}
                  activeOpacity={0.75}
                >
                  <Image source={SOCIAL_ICONS.facebook} style={styles.socialIcon} />
                </TouchableOpacity>
              ) : null}
              {profile?.instagram ? (
                <TouchableOpacity
                  onPress={() => setQrModal({ visible: true, url: profile.instagram!, label: "Instagram" })}
                  activeOpacity={0.75}
                >
                  <Image source={SOCIAL_ICONS.instagram} style={styles.socialIcon} />
                </TouchableOpacity>
              ) : null}
              {profile?.tiktok ? (
                <TouchableOpacity
                  onPress={() => setQrModal({ visible: true, url: profile.tiktok!, label: "TikTok" })}
                  activeOpacity={0.75}
                >
                  <Image source={SOCIAL_ICONS.tiktok} style={styles.socialIcon} />
                </TouchableOpacity>
              ) : null}
              {profile?.youtube ? (
                <TouchableOpacity
                  onPress={() => setQrModal({ visible: true, url: profile.youtube!, label: "YouTube" })}
                  activeOpacity={0.75}
                >
                  <Image source={SOCIAL_ICONS.youtube} style={styles.socialIcon} />
                </TouchableOpacity>
              ) : null}
              {profile?.thread ? (
                <TouchableOpacity
                  onPress={() => setQrModal({ visible: true, url: profile.thread!, label: "Threads" })}
                  activeOpacity={0.75}
                >
                  <Image source={SOCIAL_ICONS.thread} style={styles.socialIcon} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ── Streak Card (Hành trình giữ chuỗi) ── */}
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Text style={styles.streakTitle}>🔥 HÀNH TRÌNH GIỮ CHUỖI</Text>
            <TouchableOpacity
              onPress={() => setMascotModalVisible(true)}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.9}
            >
              <Animated.View style={[styles.changeMascotHeaderBtn, { transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.changeMascotHeaderEmoji}>🐾</Text>
              </Animated.View>
            </TouchableOpacity>
          </View>

          <View style={styles.streakMainContent}>
            <Image
              source={getStreakLevelImage(
                getStreakLevel(profile?.streakCount || 0),
              )}
              style={styles.streakBigImage}
            />
            
            <Text style={styles.streakLevelNameTxt}>
              {getStreakLevelInfo(getStreakLevel(profile?.streakCount || 0)).name}
            </Text>
            
            <Text style={styles.streakLevelDescriptionTxt}>
              {getStreakLevelInfo(getStreakLevel(profile?.streakCount || 0)).description}
            </Text>

            <Text style={styles.streakDaysTxt}>
              {profile?.streakCount || 0} Ngày Giữ Lửa
            </Text>
          </View>

          {/* Progress Bar */}
          {getStreakLevel(profile?.streakCount || 0) < 18 && (() => {
            const pct = Math.min(100, Math.max(0, (((profile?.streakCount || 0) % 30) / 30) * 100));
            return (
              <View style={styles.progressBarWrapper}>
                {/* Track (overflow hidden để clip fill) */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${pct}%` },
                    ]}
                  />
                </View>
                {/* Fire gif ở đầu fill, nằm ngoài track để hiện toàn bộ */}
                {pct > 0 && (
                  <Image
                    source={require("../../assets/series/gif/fire_progress.gif")}
                    style={[
                      styles.fireGif,
                      { left: `${pct}%`, transform: [{ translateX: -14 }] },
                    ]}
                  />
                )}
              </View>
            );
          })()}

          <Text style={styles.streakRecoveryLimitTxt}>
          Mỗi tháng sẽ có 3 lượt khôi phục chuỗi
          </Text>
        </View>

        {/* ── Detail Cards ── */}
        {profile?.gender ||
        profile?.birthday ||
        profile?.job ||
        profile?.education ||
        profile?.hobby ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Thông tin chi tiết</Text>

            {profile?.gender ? (
              <View style={styles.infoRow}>
                <View
                  style={[styles.infoIconBox, { backgroundColor: "#ecfeff" }]}
                >
                  <User color="#0891b2" size={16} />
                </View>
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabel}>Giới tính</Text>
                  <Text style={styles.infoValue}>{profile.gender}</Text>
                </View>
              </View>
            ) : null}

            {profile?.birthday ? (
              <View style={styles.infoRow}>
                <View
                  style={[styles.infoIconBox, { backgroundColor: "#f5f3ff" }]}
                >
                  <Calendar color="#7c3aed" size={16} />
                </View>
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabel}>Ngày sinh</Text>
                  <Text style={styles.infoValue}>{profile.birthday}</Text>
                </View>
              </View>
            ) : null}

            {profile?.job ? (
              <View style={styles.infoRow}>
                <View
                  style={[styles.infoIconBox, { backgroundColor: "#eff6ff" }]}
                >
                  <Briefcase color={NAVY} size={16} />
                </View>
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabel}>Công việc</Text>
                  <Text style={styles.infoValue}>{profile.job}</Text>
                </View>
              </View>
            ) : null}

            {profile?.education ? (
              <View style={styles.infoRow}>
                <View
                  style={[styles.infoIconBox, { backgroundColor: "#f0fdf4" }]}
                >
                  <GraduationCap color="#16a34a" size={16} />
                </View>
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabel}>Học vấn</Text>
                  <Text style={styles.infoValue}>{profile.education}</Text>
                </View>
              </View>
            ) : null}

            {profile?.hobby ? (
              <View style={styles.infoRow}>
                <View
                  style={[styles.infoIconBox, { backgroundColor: "#fff1f2" }]}
                >
                  <Heart color="#e11d48" size={16} />
                </View>
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabel}>Sở thích</Text>
                  <Text style={styles.infoValue}>{profile.hobby}</Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ═══════════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════════ */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
              style={styles.headerBtn}
            >
              <X color="#fff" size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
            <TouchableOpacity
              onPress={handleSaveProfile}
              style={styles.headerSaveBtn}
            >
              <Text style={styles.headerSaveTxt}>Lưu</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {/* Avatar picker */}
              <View style={styles.modalAvatarSection}>
                <TouchableOpacity
                  onPress={handlePickAvatar}
                  activeOpacity={0.8}
                  style={styles.modalAvatarWrap}
                >
                  {editAvatar ? (
                    <Image
                      source={{ uri: editAvatar }}
                      style={styles.modalAvatarImg}
                    />
                  ) : (
                    <View style={styles.modalAvatarFallback}>
                      <Text style={styles.modalAvatarInitial}>
                        {editName ? editName.charAt(0).toUpperCase() : "U"}
                      </Text>
                    </View>
                  )}
                  <View style={styles.modalCameraOverlay}>
                    <Camera color="#fff" size={18} />
                  </View>
                </TouchableOpacity>
                <Text style={styles.modalAvatarHint}>
                  Chạm để đổi ảnh đại diện
                </Text>
                <TextInput
                  style={styles.modalUrlInput}
                  placeholder="Hoặc dán link URL ảnh..."
                  placeholderTextColor="#94a3b8"
                  value={editAvatar}
                  onChangeText={setEditAvatar}
                />
                {profile?.avatarHistory && profile.avatarHistory.length > 0 && (
                  <View style={styles.historySection}>
                    <Text style={styles.historyTitle}>
                      Ảnh đã dùng trước đây:
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.historyScroll}
                    >
                      {profile.avatarHistory.map((histUri, idx) => (
                        <TouchableOpacity
                          key={`hist-${idx}`}
                          onPress={() => setPreviewImageUri(histUri)}
                          style={[
                            styles.historyItemWrap,
                            editAvatar === histUri && styles.historyItemActive,
                          ]}
                          activeOpacity={0.7}
                        >
                          <Image
                            source={{ uri: histUri }}
                            style={styles.historyItemImg}
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Group 1 */}
              <Text style={styles.groupLabel}>Thông tin cơ bản</Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Họ và tên *</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Nhập họ và tên..."
                  placeholderTextColor="#94a3b8"
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Biệt danh</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="@username..."
                  placeholderTextColor="#94a3b8"
                  value={editNickname}
                  onChangeText={setEditNickname}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Giới thiệu (Bio)</Text>
                <TextInput
                  style={[styles.fieldInput, styles.fieldArea]}
                  placeholder="Viết vài dòng về bản thân..."
                  placeholderTextColor="#94a3b8"
                  value={editBio}
                  onChangeText={setEditBio}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Giới tính + Ngày sinh */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Giới tính</Text>
                <View style={styles.genderRow}>
                  {["Nam", "Nữ", "Riêng tư"].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderBtn,
                        editGender === g && styles.genderBtnOn,
                      ]}
                      onPress={() => setEditGender(g)}
                    >
                      <Text
                        style={[
                          styles.genderBtnTxt,
                          editGender === g && styles.genderBtnTxtOn,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.rowPair}>
                {/* Ngày sinh — date picker */}
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Ngày sinh</Text>
                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Calendar color={NAVY} size={16} />
                    <Text
                      style={[
                        styles.datePickerTxt,
                        !editBirthday && { color: "#94a3b8" },
                      ]}
                    >
                      {editBirthday || "Chọn ngày sinh"}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={birthdayDate}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      maximumDate={new Date()}
                      onChange={(
                        event: DateTimePickerEvent,
                        selected?: Date,
                      ) => {
                        setShowDatePicker(Platform.OS === "ios");
                        if (event.type === "set" && selected) {
                          setBirthdayDate(selected);
                          setEditBirthday(formatDateVN(selected));
                        } else {
                          setShowDatePicker(false);
                        }
                      }}
                    />
                  )}
                </View>

                {/* Ngày tham gia — read-only */}
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Tham gia từ</Text>
                  <View style={styles.readonlyField}>
                    <Lock color="#94a3b8" size={14} />
                    <Text style={styles.readonlyTxt}>
                      {joinDateDisplay || "—"}
                    </Text>
                  </View>
                  <Text style={styles.readonlyHint}>
                    Tự động từ giao dịch đầu tiên
                  </Text>
                </View>
              </View>

              {/* Group 2 */}
              <Text style={styles.groupLabel}>Công việc & Học vấn</Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Công việc</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Nghề nghiệp hiện tại..."
                  placeholderTextColor="#94a3b8"
                  value={editJob}
                  onChangeText={setEditJob}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Học vấn</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Trường / Trình độ..."
                  placeholderTextColor="#94a3b8"
                  value={editEducation}
                  onChangeText={setEditEducation}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Sở thích</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Đọc sách, du lịch..."
                  placeholderTextColor="#94a3b8"
                  value={editHobby}
                  onChangeText={setEditHobby}
                />
              </View>

              {/* Group 3 */}
              <Text style={styles.groupLabel}>Mạng xã hội</Text>

              {[
                {
                  key: "facebook",
                  icon: SOCIAL_ICONS.facebook,
                  placeholder: "Facebook",
                  value: editFacebook,
                  set: setEditFacebook,
                },
                {
                  key: "instagram",
                  icon: SOCIAL_ICONS.instagram,
                  placeholder: "Instagram",
                  value: editInstagram,
                  set: setEditInstagram,
                },
                {
                  key: "tiktok",
                  icon: SOCIAL_ICONS.tiktok,
                  placeholder: "TikTok",
                  value: editTiktok,
                  set: setEditTiktok,
                },
                {
                  key: "youtube",
                  icon: SOCIAL_ICONS.youtube,
                  placeholder: "YouTube",
                  value: editYoutube,
                  set: setEditYoutube,
                },
                {
                  key: "thread",
                  icon: SOCIAL_ICONS.thread,
                  placeholder: "Thread",
                  value: editThread,
                  set: setEditThread,
                },
              ].map(({ key, icon, placeholder, value, set }) => (
                <View key={key} style={styles.socialField}>
                  <Image source={icon} style={styles.socialFieldIcon} />
                  <TextInput
                    style={styles.socialFieldInput}
                    placeholder={`Link / @ ${placeholder}`}
                    placeholderTextColor="#94a3b8"
                    value={value}
                    onChangeText={set}
                    autoCapitalize="none"
                  />
                </View>
              ))}

              <View style={{ height: 32 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={!!previewImageUri}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <TouchableOpacity
          style={styles.previewBackdrop}
          activeOpacity={1}
          onPress={() => setPreviewImageUri(null)}
        >
          <View
            style={styles.previewContainer}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity
              style={styles.previewCloseBtn}
              onPress={() => setPreviewImageUri(null)}
            >
              <X color="#fff" size={24} />
            </TouchableOpacity>

            {previewImageUri && (
              <Image
                source={{ uri: previewImageUri }}
                style={styles.previewImage}
              />
            )}

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.previewActionBtn, styles.previewUseBtn]}
                onPress={() => {
                  if (previewImageUri) {
                    setEditAvatar(previewImageUri);
                    setPreviewImageUri(null);
                  }
                }}
              >
                <Text style={styles.previewActionTxt}>
                  Dùng làm ảnh đại diện
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.previewActionBtn, styles.previewDeleteBtn]}
                onPress={() => {
                  if (previewImageUri) {
                    handleDeleteHistoryImage(previewImageUri);
                  }
                }}
              >
                <Text style={styles.previewActionTxt}>Xóa ảnh này</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* QR Code Modal cho mạng xã hội */}
      <Modal
        visible={qrModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setQrModal({ visible: false, url: "", label: "" })}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.75)",
            alignItems: "center",
            justifyContent: "center",
          }}
          activeOpacity={1}
          onPress={() => setQrModal({ visible: false, url: "", label: "" })}
        >
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 24,
              padding: 32,
              alignItems: "center",
              marginHorizontal: 32,
              elevation: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
            }}
          >
            {/* Tên mạng xã hội */}
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "#1e293b",
                marginBottom: 20,
                letterSpacing: 0.5,
              }}
            >
              {qrModal.label}
            </Text>

            {/* QR Code */}
            {qrModal.url ? (
              <QRCode
                value={qrModal.url}
                size={240}
                backgroundColor="#ffffff"
                color="#1e293b"
              />
            ) : null}

            {/* URL hint */}
            <Text
              style={{
                marginTop: 20,
                fontSize: 12,
                color: "#94a3b8",
                textAlign: "center",
                maxWidth: 240,
              }}
              numberOfLines={2}
            >
              {qrModal.url}
            </Text>

            <Text
              style={{
                marginTop: 12,
                fontSize: 13,
                color: "#64748b",
              }}
            >
              Quét để kết bạn
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Mascot Selector Modal */}
      <Modal
        visible={isMascotModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMascotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.mascotModalContent}>
            <View style={styles.mascotModalHeader}>
              <Text style={styles.mascotModalTitle}>Chọn linh vật đồng hành</Text>
              <TouchableOpacity onPress={() => setMascotModalVisible(false)}>
                <X color="#334155" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.mascotGrid} showsVerticalScrollIndicator={false}>
              {MASCOT_LIST.map((mascot) => {
                const isSelected = (profile?.mascot || "adagio") === mascot.key;
                return (
                  <TouchableOpacity
                    key={mascot.key}
                    style={[
                      styles.mascotCard,
                      isSelected && styles.mascotCardActive,
                    ]}
                    onPress={() => handleSelectMascot(mascot.key)}
                  >
                    <Image
                      source={mascot.image}
                      style={styles.mascotCardImage}
                      resizeMode="contain"
                    />
                    <Text
                      style={[
                        styles.mascotCardName,
                        isSelected && styles.mascotCardNameActive,
                      ]}
                    >
                      {mascot.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.activeIndicatorBadge}>
                        <Text style={styles.activeIndicatorText}>Đang dùng</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;
