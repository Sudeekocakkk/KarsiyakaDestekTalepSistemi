import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const specializations = [
  { name: "Donanım", description: "Donanım arızaları" },
  { name: "Yazılım", description: "Yazılım ve uygulama sorunları" },
  { name: "Ağ ve İnternet", description: "Ağ bağlantısı ve internet sorunları" },
  { name: "Diğer", description: "Genel ve tanımsız talepler" },
];

const categories = [
  { name: "Yazıcı Sorunu", specialization: "Donanım" },
  { name: "Bilgisayar Arızası", specialization: "Donanım" },
  { name: "Yazılım Hatası", specialization: "Yazılım" },
  { name: "Ağ ve İnternet", specialization: "Ağ ve İnternet" },
  { name: "Diğer", specialization: "Diğer" },
];

const technicians = [
  {
    name: "Teknik Personel Donanım",
    email: "teknik.donanim@karsiyaka.local",
    specializations: ["Donanım"],
  },
  {
    name: "Teknik Personel Yazılım",
    email: "teknik.yazilim@karsiyaka.local",
    specializations: ["Yazılım"],
  },
  {
    name: "Teknik Personel Ağ",
    email: "teknik.ag@karsiyaka.local",
    specializations: ["Ağ ve İnternet"],
  },
  {
    name: "Teknik Personel Genel",
    email: "teknik.diger@karsiyaka.local",
    specializations: ["Diğer"],
  },
];

async function main() {
  const department = await prisma.department.upsert({
    where: { name: "Bilgi İşlem Müdürlüğü" },
    update: { isActive: true },
    create: { name: "Bilgi İşlem Müdürlüğü" },
  });

  const specializationMap = {};

  for (const item of specializations) {
    const specialization = await prisma.specialization.upsert({
      where: { name: item.name },
      update: {
        description: item.description,
        isActive: true,
      },
      create: {
        name: item.name,
        description: item.description,
      },
    });

    specializationMap[item.name] = specialization.id;
  }

  for (const item of categories) {
    await prisma.category.upsert({
      where: { name: item.name },
      update: {
        isActive: true,
        specializationId: specializationMap[item.specialization],
      },
      create: {
        name: item.name,
        specializationId: specializationMap[item.specialization],
      },
    });
  }

  const password = await bcrypt.hash("teknik123", 10);

  for (const item of technicians) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        name: item.name,
        role: "TEKNIK_PERSONEL",
        isActive: true,
        departmentId: department.id,
      },
      create: {
        name: item.name,
        email: item.email,
        password,
        role: "TEKNIK_PERSONEL",
        isActive: true,
        departmentId: department.id,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        specializations: {
          set: item.specializations.map((name) => ({
            id: specializationMap[name],
          })),
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed tamamlandı.");
  })
  .catch(async (error) => {
    console.error("Seed hatası:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
