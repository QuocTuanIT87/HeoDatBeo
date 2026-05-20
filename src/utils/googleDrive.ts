import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { storage } from '../store/storage';

const GOOGLE_CLIENT_ID = '765227702920-stgd8jrmp5ms2ad5aoqjdum048i8l9hg.apps.googleusercontent.com';
const BACKUP_FOLDER_NAME = 'data_heo_dat_beo';

export interface GoogleDriveBackupInfo {
  success: boolean;
  message: string;
}

/**
 * Cấu hình Google Sign-In
 */
export const initGoogleDrive = () => {
  GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    webClientId: GOOGLE_CLIENT_ID,
    offlineAccess: true,
  });
};

/**
 * Đăng nhập Google
 */
export const signInGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const res = await GoogleSignin.signIn();
    if (res.type === 'success') {
      const tokens = await GoogleSignin.getTokens();
      return {
        success: true,
        userInfo: res.data,
        accessToken: tokens.accessToken,
      };
    } else {
      return {
        success: false,
        error: 'Đăng nhập bị hủy bởi người dùng.',
      };
    }
  } catch (error: any) {
    console.error('Lỗi đăng nhập Google Sign-In:', error);
    return {
      success: false,
      error: error.message || String(error),
    };
  }
};

/**
 * Đăng xuất Google
 */
export const signOutGoogle = async () => {
  try {
    await GoogleSignin.signOut();
    return { success: true };
  } catch (error: any) {
    console.error('Lỗi đăng xuất Google:', error);
    return { success: false, error: error.message };
  }
};

let activeTokenPromise: Promise<string | null> | null = null;

/**
 * Lấy Access Token hiện tại (tự động làm mới nếu hết hạn, tránh gọi đồng thời)
 */
export const getAccessToken = async (): Promise<string | null> => {
  if (activeTokenPromise) {
    return activeTokenPromise;
  }

  activeTokenPromise = (async () => {
    try {
      const hasPrevious = GoogleSignin.hasPreviousSignIn();
      if (!hasPrevious) {
        // Thử đăng nhập âm thầm để phục hồi session
        const silentRes = await GoogleSignin.signInSilently();
        if (silentRes.type !== 'success') return null;
      }
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken;
    } catch (error) {
      console.error('Lỗi lấy Access Token:', error);
      return null;
    } finally {
      activeTokenPromise = null;
    }
  })();

  return activeTokenPromise;
};

/**
 * Tìm hoặc tạo thư mục data_heo_dat_beo trên Google Drive
 */
const getOrCreateBackupFolder = async (accessToken: string): Promise<string | null> => {
  try {
    // 1. Tìm kiếm folder
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const searchData = await searchResponse.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // 2. Không tìm thấy -> Tạo folder mới
    const createUrl = 'https://www.googleapis.com/drive/v3/files';
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: BACKUP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    const createData = await createResponse.json();
    return createData.id || null;
  } catch (error) {
    console.error('Lỗi tìm/tạo folder Google Drive:', error);
    return null;
  }
};

/**
 * Thực hiện sao lưu dữ liệu hiện tại lên Google Drive và dọn dẹp dữ liệu cũ (chỉ giữ 7 ngày mới nhất)
 * @param dataStr Dữ liệu backup dạng JSON chuỗi
 */
export const uploadBackupToGoogleDrive = async (dataStr: string): Promise<GoogleDriveBackupInfo> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return { success: false, message: 'Chưa đăng nhập tài khoản Google hoặc phiên làm việc đã hết hạn.' };
    }

    const folderId = await getOrCreateBackupFolder(accessToken);
    if (!folderId) {
      return { success: false, message: 'Không thể tạo hoặc truy cập thư mục lưu trữ trên Google Drive.' };
    }

    // 1. Sinh tên file theo ngày hiện tại: heodatbeo_YYYY-MM-DD.txt
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const fileName = `heodatbeo_${year}-${month}-${day}.txt`;

    // 2. Kiểm tra xem file ngày hôm nay đã tồn tại trong folder này chưa
    const checkFileUrl = `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and '${folderId}' in parents and trashed=false`;
    const checkResponse = await fetch(checkFileUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const checkData = await checkResponse.json();
    const existingFile = checkData.files && checkData.files.length > 0 ? checkData.files[0] : null;

    // 3. Thực hiện Multipart Upload (Tạo mới hoặc Cập nhật file hiện tại)
    let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    let method = 'POST';

    if (existingFile) {
      // Đã tồn tại file cùng ngày -> Cập nhật ghi đè file cũ
      uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`;
      method = 'PATCH';
    }

    const boundary = 'heo_dat_beo_backup_boundary';
    const metadata = {
      name: fileName,
      parents: existingFile ? undefined : [folderId],
      mimeType: 'text/plain',
    };

    const multipartBody =
      `\r\n--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: text/plain; charset=UTF-8\r\n\r\n` +
      `${dataStr}\r\n` +
      `--${boundary}--`;

    const uploadResponse = await fetch(uploadUrl, {
      method: method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload thất bại: ${errorText}`);
    }

    // 4. Dọn dẹp dữ liệu cũ: Quét các file trong thư mục, chỉ giữ tối đa 7 ngày gần nhất
    const listFilesUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and mimeType='text/plain' and name contains 'heodatbeo_' and trashed=false&orderBy=name desc&pageSize=100`;
    const listResponse = await fetch(listFilesUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const listData = await listResponse.json();
    if (listData.files && listData.files.length > 7) {
      const filesToDelete = listData.files.slice(7); // Lấy các file cũ từ vị trí số 7 trở đi
      for (const file of filesToDelete) {
        try {
          await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          console.log(`Đã xóa file backup cũ: ${file.name}`);
        } catch (delErr) {
          console.error(`Không thể xóa file backup cũ ${file.name}:`, delErr);
        }
      }
    }

    return {
      success: true,
      message: 'Đã sao lưu dữ liệu lên Google Drive thành công.',
    };
  } catch (error: any) {
    console.error('Lỗi khi sao lưu dữ liệu lên Google Drive:', error);
    return {
      success: false,
      message: error.message || String(error),
    };
  }
};

let isAutoBackupRunning = false;

/**
 * Kiểm tra và thực hiện tự động sao lưu nếu bật chế độ tự động và thời gian hiện tại thoả mãn (mỗi ngày một lần, sau 1h sáng)
 */
export const checkAndRunAutoBackup = async () => {
  if (isAutoBackupRunning) return;
  isAutoBackupRunning = true;
  try {
    const isEnabled = await storage.isGoogleDriveAutoBackupEnabled();
    if (!isEnabled) return;

    const token = await getAccessToken();
    if (!token) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const lastBackupTs = await storage.getGoogleDriveLastBackupTimestamp();
    let shouldBackup = false;

    if (lastBackupTs === 0) {
      // Chưa từng backup -> backup luôn nếu giờ >= 1
      if (now.getHours() >= 1) {
        shouldBackup = true;
      }
    } else {
      const lastBackupDate = new Date(lastBackupTs);
      const ly = lastBackupDate.getFullYear();
      const lm = String(lastBackupDate.getMonth() + 1).padStart(2, '0');
      const ld = String(lastBackupDate.getDate()).padStart(2, '0');
      const lastBackupDateStr = `${ly}-${lm}-${ld}`;

      // Nếu hôm nay chưa backup, và giờ hiện tại đã >= 1:00 sáng
      if (lastBackupDateStr !== todayStr && now.getHours() >= 1) {
        shouldBackup = true;
      }
    }

    if (shouldBackup) {
      console.log('Bắt đầu tự động sao lưu dữ liệu lên Google Drive...');
      const dataStr = await storage.exportData();
      const res = await uploadBackupToGoogleDrive(dataStr);
      const backupTime = Date.now();
      await storage.setGoogleDriveLastBackupTimestamp(backupTime);
      await storage.setGoogleDriveLastBackupStatus(res.success ? 'success' : 'failed');
      console.log('Kết quả tự động sao lưu:', res.message);
    }
  } catch (e) {
    console.error('Lỗi trong quá trình tự động sao lưu:', e);
  } finally {
    isAutoBackupRunning = false;
  }
};
