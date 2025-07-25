import pkg from '@prisma/client';
import bcrypt from 'bcrypt';
import MarkdownIt from 'markdown-it';
import mathjax3 from 'markdown-it-mathjax3';

const { PrismaClient } = pkg;
const md = MarkdownIt();
md.use(mathjax3);

const prisma = new PrismaClient();

const adminEncryptedPass = await bcrypt.hash('exampleadminpassword', 10);
const userEncryptedPass = await bcrypt.hash('exampleuserpassword', 10);
const anonymousPassword = await bcrypt.hash('exampleanonymouspassword', 10);

const exampleTopic = [
  'General',
  'Introduction to Algorithms',
  'Structure and Interpretation of Computer Programs',
  'The Art of Computer Programming',
  'Purely Functional Data Structures',
  'Haskell Programming from First Principles',
  'Learn You Some Erlang for Great Good!',
  'Clojure for the Brave and True',
  'Let over Lambda',
  'Types and Programming Languages',
  'The Mythical Man-Month',
];

const loremIpsum = `
# Patens si removi multa pectora

## Cum sistite noctes pulsumque et Minyis tantus

$\\sqrt{3x-1}+(1+x)^2$

Lorem markdownum. Uno an mediis oculis incedit quoque, rauca versus paludosa
talibus, nunc rupit usum vidit non!

**Indignis silvas** offensa turba, agros sui [vestem tristes](http://quaet.net/)
sua sensit, litora socii et. Umbrae praemia. Nunc quod Parnasi illi quattuor.
Cantu sine: saxum Cadmi cepit eripe animal spatiarer patria iracunda, dum.

- Remotos auras dixerat inmisitque lecto eiaculatur probatque
- Villos intonsumque tumidus mota venturi artus creberrima
- Humo nec victu nunc verba
- Stimulosque siquis umero relatus occupat Ilion ullis

## Vocari post flebat danda deiecerat

Fulmine nota, hanc patietur es merito scindit in tui. Postquam demptos [bos nati
temporis](http://est.io/nil) letiferam. Fuerat cacumen dederat, deus Dianae
perdet triformis cubile, cultros. Loqui qui mihi creverunt iamque temptat
repetitaque suo stellas, imis obsessum quoque pharetratus iubet?

    cVpiSidebar.clean(edi - goodputMaster * brouter, metaShellCircuit + linkedin
            * moduleOpacity + 88);
    if (hostClipboardDsl != hypermedia(bufferHoc, standby, bar_remote)) {
        upnp_scareware_wan += parity_odbc_shortcut;
        mp_ad_virtual.optical += 5;
    }
    if (clean <= koffice) {
        vpn_component.alu_file(softwareData, read_hard(telnetBotnetPmu,
                wysiwyg_clock_drag, tweetOpticalThunderbolt), schema);
        arrayLanguage += logicDmaVolume + iterationNative + windowsWiMedia;
        agp(flashRippingWebsite.port(platform_cable, online_vpi,
                gigaflops_firewire_rpm), servlet_metal, fontIntelligenceSkin);
    }
    cyberbullying -= addressDrive.samba_speakers_download(boxDigital * 364111,
            string_clean_readme) + noc(dns(model_optic, adfShortcut,
            sip_terahertz), olap_logic_user);

Nervi nec lateri ut genitum succidit parte vocatum peregit, sic *respiceret
prima* aut umero clademque nomenque. Iam est dixisse armis duorum aestibus et
furor Venus Theti dempto Iovis, contra a.

Dolens ut aurum mollis rutilos coma quem inde. Longam novus. An canes latitantia
somnus certamina [positis](http://www.vaporme.org/aoniusvidi) erat; et sit
contempto pendens Mota dumque geratis medio tantaeque et summa, illa? Quidem
insuperabile tuum vulnera haec **fuit commenta** cursu sistite, ebur? Vestra
coit qui deum vasto Phocus delabitur [Protesilae
posuistis](http://multaque-intravit.io/) plano, Lyncus.
`;

// id: (i + 1)
async function createThread({ id, topicId, createdBy, slug }) {
  const topic = await prisma.topic.findFirst({
    where: {
      id: topicId,
    },
  });

  if (!topic) throw new Error('Topic was not found.');

  await prisma.$transaction(async (tx) => {
    const { topicCount } = topic;

    await tx.thread.upsert({
      where: { id },
      update: {},
      create: {
        title: 'Lorem Ipsum',
        body: loremIpsum,
        bodyHtml: md.render(loremIpsum),
        createdBy: { connect: { id: createdBy } },
        topic: { connect: { id: topicId } },
        globalCount: topicCount + 1,
        ip: '::1',
        slug,
      },
    });

    await tx.topic.update({
      where: {
        id: topicId,
      },
      data: {
        topicCount: topicCount + 1,
        lastBumped: new Date(),
      },
    });
  });

  return null;
}

async function createReply({ id, threadId, createdBy }) {
  const thread = await prisma.thread.findFirst({
    where: {
      id: threadId,
    },
    include: {
      topic: true,
      replies: true,
    },
  });

  if (!thread) throw new Error(`Thread ${id} not found.`);

  await prisma.$transaction(async (tx) => {
    await tx.reply.upsert({
      where: { id },
      update: {},
      create: {
        body: loremIpsum,
        bodyHtml: md.render(loremIpsum),
        createdBy: { connect: { id: createdBy } },
        thread: { connect: { id: thread.id } },
        globalCount: thread.replyCount + 1,
        ip: '::1',
      },
    });

    await tx.thread.update({
      where: {
        id: threadId,
      },
      data: {
        replyCount: thread.replyCount + 1,
        lastBumped: new Date(),
      },
    });
  });

  return null;
}

async function seedUsers() {
  console.log('\n⌛ Seeding the user accounts.');

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminEncryptedPass,
      role: 'ADMIN,USER',
    },
  });

  await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      password: userEncryptedPass,
      role: 'USER',
      referredBy: {
        connect: { id: 1 },
      },
    },
  });

  await prisma.user.upsert({
    where: { username: 'Anonymous' },
    update: {},
    create: {
      username: 'Anonymous',
      password: anonymousPassword,
      role: 'USER',
      referredBy: {
        connect: { id: 1 },
      },
    },
  });

  console.log('✅ Accounts seeded.');
}

async function seedTopics({ topicQuantity }) {
  for (let i = 0; i < topicQuantity; i += 1) {
    const createdById = Math.floor(Math.random() * 2) + 1;

    await prisma.topic.upsert({
      where: { id: i + 1 },
      update: {},
      create: {
        title: exampleTopic[i % exampleTopic.length],
        body: loremIpsum,
        slug: `seed-${i + 1}`,
        bodyHtml: md.render(loremIpsum),
        createdBy: { connect: { id: createdById } },
        ip: '::1',
      },
    });
  }

  console.log('✅ Topics seeded.');
}

async function seedThreads({ topicQuantity, threadQuantity }) {
  for (let i = 0; i < threadQuantity; i += 1) {
    const createdById = Math.floor(Math.random() * 2) + 1;
    const topicId = Math.floor(Math.random() * topicQuantity) + 1;

    await createThread({
      id: i + 1,
      topicId,
      createdBy: createdById,
      slug: 'thread-slug',
    });
  }

  console.log('✅ Threads seeded.');
}

async function seedReplies({ threadQuantity, replyQuantity }) {
  for (let i = 0; i < replyQuantity; i += 1) {
    const createdById = Math.floor(Math.random() * 2) + 1;
    const threadId = Math.floor(Math.random() * threadQuantity) + 1;

    await createReply({
      id: i + 1,
      createdBy: createdById,
      threadId,
    });
  }

  console.log('✅ Replies seeded.');
}

async function main() {
  console.log(`Seeding [${process.env.NODE_ENV}]`);
  if (process.env.NODE_ENV === 'development') {
    const devConfig = {
      topicQuantity: 15,
      threadQuantity: 10,
      replyQuantity: 30,
    };

    await seedUsers();
    await seedTopics(devConfig);
    await seedThreads(devConfig);
    await seedReplies(devConfig);
  } else if (process.env.NODE_ENV === 'test') {
    await seedUsers();
  } else {
    console.log(`${process.env.NODE_ENV} is not development/test/production. Doing nothing.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('\n🙌 Database seeded. 🙌');
    await prisma.$disconnect();
  });
