import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Alert as RNAlert } from 'react-native';
import { Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

interface AlertShowOptions extends AlertOptions {
  type?: 'normal' | 'success' | 'error' | 'warning';
}

// Global reference holder
let alertInstance: {
  show: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertShowOptions
  ) => void;
  hide: () => void;
} | null = null;

const detectType = (title: string, message?: string): 'normal' | 'success' | 'error' | 'warning' => {
  const text = `${title} ${message || ''}`.toLowerCase();
  
  if (
    text.includes('thành công') ||
    text.includes('phục hồi') ||
    text.includes('đã lưu') ||
    text.includes('đã cập nhật') ||
    text.includes('đạt mục tiêu')
  ) {
    return 'success';
  }
  
  if (
    text.includes('lỗi') ||
    text.includes('không thể') ||
    text.includes('thất bại') ||
    text.includes('không đúng') ||
    text.includes('chưa nhập') ||
    text.includes('chưa hợp lệ') ||
    text.includes('không hợp lệ') ||
    text.includes('không đủ') ||
    text.includes('sai')
  ) {
    return 'error';
  }
  
  if (
    text.includes('cảnh báo') ||
    text.includes('chú ý') ||
    text.includes('xác nhận') ||
    text.includes('yêu cầu') ||
    text.includes('chắc chắn') ||
    text.includes('nguy hiểm')
  ) {
    return 'warning';
  }
  
  return 'normal';
};

export const CustomAlert = () => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [buttons, setButtons] = useState<AlertButton[]>([]);
  const [type, setType] = useState<'normal' | 'success' | 'error' | 'warning'>('normal');
  const [options, setOptions] = useState<AlertShowOptions>({});

  useEffect(() => {
    alertInstance = {
      show: (t, m, b, opts) => {
        setTitle(t);
        setMessage(m || '');
        setButtons(b || []);
        setOptions(opts || {});
        
        // Determine type: explicit or auto-detected
        const detectedType = opts?.type || detectType(t, m);
        setType(detectedType);
        
        setVisible(true);
      },
      hide: () => {
        setVisible(false);
      }
    };

    return () => {
      alertInstance = null;
    };
  }, []);

  if (!visible) return null;

  const themes = {
    normal: {
      cardBg: '#ffffff',
      border: '#e2e8f0',
      title: '#1e293b',
      message: '#475569',
      primaryBtnBg: '#475569',
      primaryBtnText: '#ffffff',
      secondaryBtnBg: '#f1f5f9',
      secondaryBtnText: '#475569',
    },
    success: {
      cardBg: '#f0fdf4',
      border: '#bbf7d0',
      title: '#166534',
      message: '#14532d',
      primaryBtnBg: '#16a34a',
      primaryBtnText: '#ffffff',
      secondaryBtnBg: '#dcfce7',
      secondaryBtnText: '#15803d',
    },
    error: {
      cardBg: '#fef2f2',
      border: '#fecaca',
      title: '#991b1b',
      message: '#7f1d1d',
      primaryBtnBg: '#dc2626',
      primaryBtnText: '#ffffff',
      secondaryBtnBg: '#fee2e2',
      secondaryBtnText: '#991b1b',
    },
    warning: {
      cardBg: '#fff7ed',
      border: '#ffedd5',
      title: '#9a3412',
      message: '#7c2d12',
      primaryBtnBg: '#ea580c',
      primaryBtnText: '#ffffff',
      secondaryBtnBg: '#ffedd5',
      secondaryBtnText: '#9a3412',
    },
  };

  const currentTheme = themes[type];

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return (
          <View style={[styles.iconWrapper, { backgroundColor: '#dcfce7' }]}>
            <CheckCircle2 size={32} color="#16a34a" />
          </View>
        );
      case 'error':
        return (
          <View style={[styles.iconWrapper, { backgroundColor: '#fee2e2' }]}>
            <AlertCircle size={32} color="#dc2626" />
          </View>
        );
      case 'warning':
        return (
          <View style={[styles.iconWrapper, { backgroundColor: '#ffedd5' }]}>
            <AlertTriangle size={32} color="#ea580c" />
          </View>
        );
      default:
        return (
          <View style={[styles.iconWrapper, { backgroundColor: '#f1f5f9' }]}>
            <Info size={32} color="#475569" />
          </View>
        );
    }
  };

  const handleButtonPress = (onPress?: () => void) => {
    setVisible(false);
    if (onPress) {
      onPress();
    }
  };

  const handleBackdropPress = () => {
    if (options.cancelable) {
      setVisible(false);
      if (options.onDismiss) {
        options.onDismiss();
      }
    }
  };

  const alertButtons = buttons.length > 0 ? buttons : [{ text: 'OK' }];

  const renderButtons = () => {
    if (alertButtons.length === 2) {
      // 2 buttons side-by-side
      return (
        <View style={styles.buttonRow}>
          {alertButtons.map((btn, index) => {
            const isCancel = btn.style === 'cancel';
            const isDestructive = btn.style === 'destructive';
            let btnBg = currentTheme.primaryBtnBg;
            let btnText = currentTheme.primaryBtnText;

            if (isCancel) {
              btnBg = currentTheme.secondaryBtnBg;
              btnText = currentTheme.secondaryBtnText;
            } else if (isDestructive) {
              btnBg = '#dc2626';
              btnText = '#ffffff';
            }

            return (
              <TouchableOpacity
                key={index}
                style={[styles.button, { backgroundColor: btnBg, flex: 1 }]}
                onPress={() => handleButtonPress(btn.onPress)}
              >
                <Text style={[styles.buttonText, { color: btnText }]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    // 1 button or 3+ buttons stacked vertically
    return (
      <View style={styles.buttonColumn}>
        {alertButtons.map((btn, index) => {
          const isCancel = btn.style === 'cancel';
          const isDestructive = btn.style === 'destructive';
          let btnBg = currentTheme.primaryBtnBg;
          let btnText = currentTheme.primaryBtnText;

          if (isCancel) {
            btnBg = currentTheme.secondaryBtnBg;
            btnText = currentTheme.secondaryBtnText;
          } else if (isDestructive) {
            btnBg = '#dc2626';
            btnText = '#ffffff';
          }

          return (
            <TouchableOpacity
              key={index}
              style={[styles.button, { backgroundColor: btnBg, width: '100%' }]}
              onPress={() => handleButtonPress(btn.onPress)}
            >
              <Text style={[styles.buttonText, { color: btnText }]}>
                {btn.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleBackdropPress}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: currentTheme.cardBg,
                  borderColor: currentTheme.border,
                },
              ]}
            >
              {renderIcon()}
              <Text style={[styles.title, { color: currentTheme.title }]}>
                {title}
              </Text>
              {message ? (
                <Text style={[styles.message, { color: currentTheme.message }]}>
                  {message}
                </Text>
              ) : null}
              {renderButtons()}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export const Alert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertShowOptions
  ) => {
    if (alertInstance) {
      alertInstance.show(title, message, buttons, options);
    } else {
      RNAlert.alert(title, message, buttons, options);
    }
  },
  success: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => {
    Alert.alert(title, message, buttons, { ...options, type: 'success' });
  },
  error: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => {
    Alert.alert(title, message, buttons, { ...options, type: 'error' });
  },
  warning: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => {
    Alert.alert(title, message, buttons, { ...options, type: 'warning' });
  },
  normal: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => {
    Alert.alert(title, message, buttons, { ...options, type: 'normal' });
  },
};
type Alert = typeof Alert;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: width * 0.85,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  buttonColumn: {
    flexDirection: 'column',
    gap: 8,
    width: '100%',
  },
  button: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
