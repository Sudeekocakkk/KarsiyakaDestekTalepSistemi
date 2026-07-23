import prisma from "../config/prisma.js";
import { getDeviceInfo } from "../utils/requestDevice.js";

// İsteğin geldiği IP + bilgisayar adını çözer ve devices tablosuna upsert
// eder (aynı cihaz tekrar geldiğinde yeni satır açmaz, yalnızca
// lastSeenAt günceller). IP hiç alınamazsa (ör. soket bilgisi yoksa) cihaz
// kaydı oluşturmadan null döner. Bilinçli olarak asla fırlatmaz — bu
// fonksiyonun başarısız olması hiçbir çağıran akışı (login, talep
// oluşturma vb.) bloklamamalı veya düşürmemelidir.
export const recordDevice = async (req) => {
  try {
    const { ip, hostname } = await getDeviceInfo(req);

    if (!ip) return null;

    const device = await prisma.device.upsert({
      where: {
        ipAddress_hostname: {
          ipAddress: ip,
          hostname,
        },
      },
      update: {},
      create: {
        ipAddress: ip,
        hostname,
      },
    });

    return device;
  } catch (error) {
    console.error("[device] Cihaz kaydı oluşturulamadı:", error.message);
    return null;
  }
};
