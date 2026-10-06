import * as THREE from 'three';
import { AvatarMorphWeights, AvatarHeadTransform, AvatarProfile } from '../types/avatar';

/**
 * مدل سه‌بعدی پارامتریک و زنده شیوا (Procedural 3D Avatar)
 * رندر شده با Three.js منطبق دقیق بر هویت بصری ثابت شیوا:
 * - پوست روشن و شفاف با تن لطیف (fair skin)
 * - چشم‌های آبی درخشان و زلال (luminous blue eyes) با عنبیه سه‌بعدی و هایلایت
 * - موهای مشکی صاف و لخت (jet-black straight silky hair)
 * - تناسبات متناسب با رده سنی (گونه‌های تپل‌تر در کودکی، ظرافت در بزرگسالی)
 * - دهان، چشم‌ها و ابروهای متحرک سه‌بعدی با قابلیت اجرای LipSync، Blink و Expression
 */
export class ProceduralShivaAvatar {
  public group: THREE.Group;
  public headGroup: THREE.Group;
  public neckGroup: THREE.Group;
  public bodyGroup: THREE.Group;

  // اجزای صورت برای انیمیشن مورف
  private upperLip: THREE.Mesh;
  private lowerLip: THREE.Mesh;
  private mouthCavity: THREE.Mesh;
  private leftEyelid: THREE.Mesh;
  private rightEyelid: THREE.Mesh;
  private leftEyeball: THREE.Group;
  private rightEyeball: THREE.Group;
  private leftEyebrow: THREE.Mesh;
  private rightEyebrow: THREE.Mesh;
  private leftCheek: THREE.Mesh;
  private rightCheek: THREE.Mesh;

  // دست و شانه برای ژست‌ها
  private leftShoulder: THREE.Mesh;
  private rightShoulder: THREE.Mesh;
  private wavingArm: THREE.Group;

  private profile: AvatarProfile;

  constructor(profile: AvatarProfile) {
    this.profile = profile;
    this.group = new THREE.Group();
    this.neckGroup = new THREE.Group();
    this.headGroup = new THREE.Group();
    this.bodyGroup = new THREE.Group();

    // ایجاد سلسله مراتب سه‌بعدی
    this.group.add(this.bodyGroup);
    this.group.add(this.neckGroup);
    this.neckGroup.add(this.headGroup);

    // ساخت اجزای سه‌بعدی
    this.buildBody();
    this.buildHead();
    this.buildHair();
    this.buildEyes();
    this.buildMouth();
    this.buildCheeks();
    this.buildEyebrows();
    this.buildArms();

    this.applyProfile(profile);
  }

  private buildBody() {
    // بالاتنه و لباس متناسب با سن و شأن شیوا
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.9, 32);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.profile.clothing_color || '#e0e7ff'),
      roughness: 0.6,
      metalness: 0.05,
    });
    const torso = new THREE.Mesh(bodyGeo, bodyMat);
    torso.position.y = -0.7;
    this.bodyGroup.add(torso);

    // یقه شیک و پوشیده
    const collarGeo = new THREE.TorusGeometry(0.22, 0.04, 16, 32);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
    });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = -0.22;
    this.bodyGroup.add(collar);

    // شانه‌ها
    const shoulderGeo = new THREE.SphereGeometry(0.14, 16, 16);
    this.leftShoulder = new THREE.Mesh(shoulderGeo, bodyMat);
    this.leftShoulder.position.set(-0.42, -0.32, 0);
    this.bodyGroup.add(this.leftShoulder);

    this.rightShoulder = new THREE.Mesh(shoulderGeo, bodyMat);
    this.rightShoulder.position.set(0.42, -0.32, 0);
    this.bodyGroup.add(this.rightShoulder);

    // گردن با پوست روشن و طبیعی
    const neckGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.35, 24);
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffe0cf, // پوست روشن و طبیعی
      roughness: 0.5,
      metalness: 0.02,
    });
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = -0.12;
    this.neckGroup.add(neck);
  }

  private buildHead() {
    // سر کشیده با گونه‌های کمی تپل و فرم لطیف
    const headGeo = new THREE.SphereGeometry(0.45, 32, 32);
    headGeo.scale(0.92, 1.08, 0.95);

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffe4d5, // پوست روشن، زنده و لطیف
      roughness: 0.48,
      metalness: 0.02,
    });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.22;
    this.headGroup.add(head);

    // بینی ظریف و طبیعی
    const noseGeo = new THREE.ConeGeometry(0.04, 0.1, 16);
    noseGeo.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.position.set(0, 0.18, 0.43);
    this.headGroup.add(nose);

    // گوش‌های ظریف
    const earGeo = new THREE.SphereGeometry(0.08, 16, 16);
    earGeo.scale(0.4, 1.0, 0.7);

    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.43, 0.22, 0);
    leftEar.rotation.y = -0.2;
    this.headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(0.43, 0.22, 0);
    rightEar.rotation.y = 0.2;
    this.headGroup.add(rightEar);
  }

  private buildHair() {
    // موهای مشکی پرکلاغی صاف، لخت و براق (هویت شیوا)
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x111215, // مشکی خالص و ابریشمی
      roughness: 0.28,
      metalness: 0.15,
    });

    // کلاهک و تاج مو
    const scalpGeo = new THREE.SphereGeometry(0.47, 32, 32);
    scalpGeo.scale(0.95, 1.1, 0.98);
    const scalp = new THREE.Mesh(scalpGeo, hairMat);
    scalp.position.set(0, 0.25, -0.02);
    this.headGroup.add(scalp);

    // چتری‌های صاف و لطیف پیشانی
    const bangsGeo = new THREE.CylinderGeometry(0.46, 0.48, 0.22, 24, 1, false, 0, Math.PI);
    const bangs = new THREE.Mesh(bangsGeo, hairMat);
    bangs.rotation.y = -Math.PI / 2;
    bangs.position.set(0, 0.46, 0.08);
    this.headGroup.add(bangs);

    // تارهای موی فرورفته در طرفین صورت (صاف و لخت)
    const sideLocksGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.7, 16);

    const leftLock = new THREE.Mesh(sideLocksGeo, hairMat);
    leftLock.position.set(-0.42, 0.05, 0.15);
    leftLock.rotation.z = 0.05;
    this.headGroup.add(leftLock);

    const rightLock = new THREE.Mesh(sideLocksGeo, hairMat);
    rightLock.position.set(0.42, 0.05, 0.15);
    rightLock.rotation.z = -0.05;
    this.headGroup.add(rightLock);

    // پشت موهای صاف و بلند ریخته‌شده روی شانه‌ها
    const backHairGeo = new THREE.CylinderGeometry(0.44, 0.48, 0.85, 24, 1, false, Math.PI, Math.PI);
    const backHair = new THREE.Mesh(backHairGeo, hairMat);
    backHair.rotation.y = -Math.PI / 2;
    backHair.position.set(0, 0.05, -0.04);
    this.headGroup.add(backHair);
  }

  private buildEyes() {
    // چشم‌های آبی درخشان و گیرا (Sapphire luminous blue)
    const eyeRadius = 0.085;

    const createEye = (isLeft: boolean) => {
      const eyeGroup = new THREE.Group();

      // صلبیه سفید چشم
      const scleraGeo = new THREE.SphereGeometry(eyeRadius, 24, 24);
      const scleraMat = new THREE.MeshStandardMaterial({
        color: 0xfcfdff,
        roughness: 0.1,
      });
      const sclera = new THREE.Mesh(scleraGeo, scleraMat);
      eyeGroup.add(sclera);

      // عنبیه آبی درخشان و کریستالی
      const irisGeo = new THREE.CircleGeometry(eyeRadius * 0.58, 24);
      const irisMat = new THREE.MeshStandardMaterial({
        color: 0x1d70b8, // آبی کبود و درخشان شیوا
        roughness: 0.15,
        metalness: 0.2,
      });
      const iris = new THREE.Mesh(irisGeo, irisMat);
      iris.position.z = eyeRadius * 0.95;
      eyeGroup.add(iris);

      // مردمک مشکی
      const pupilGeo = new THREE.CircleGeometry(eyeRadius * 0.28, 20);
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050811 });
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.z = eyeRadius * 0.97;
      eyeGroup.add(pupil);

      // هایلایت انعکاس نور (برق چشم معصومانه و زنده)
      const glintGeo = new THREE.CircleGeometry(eyeRadius * 0.12, 12);
      const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const glint = new THREE.Mesh(glintGeo, glintMat);
      glint.position.set(eyeRadius * 0.18, eyeRadius * 0.18, eyeRadius * 0.99);
      eyeGroup.add(glint);

      // پلک متحرک سه‌بعدی برای پلک‌زدن طبیعی (Blink)
      const eyelidGeo = new THREE.SphereGeometry(eyeRadius * 1.06, 24, 16, 0, Math.PI, 0, Math.PI / 2);
      const eyelidMat = new THREE.MeshStandardMaterial({
        color: 0xffd8c6,
        roughness: 0.5,
      });
      const eyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
      eyelid.rotation.x = -Math.PI / 2;
      eyelid.position.z = 0;
      eyeGroup.add(eyelid);

      return { eyeGroup, eyelid };
    };

    const left = createEye(true);
    this.leftEyeball = left.eyeGroup;
    this.leftEyelid = left.eyelid;
    this.leftEyeball.position.set(-0.16, 0.24, 0.36);
    this.headGroup.add(this.leftEyeball);

    const right = createEye(false);
    this.rightEyeball = right.eyeGroup;
    this.rightEyelid = right.eyelid;
    this.rightEyeball.position.set(0.16, 0.24, 0.36);
    this.headGroup.add(this.rightEyeball);
  }

  private buildEyebrows() {
    // ابروهای مشکی ظریف و کمان‌دار
    const browMat = new THREE.MeshBasicMaterial({ color: 0x1f2128 });
    const browGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);

    this.leftEyebrow = new THREE.Mesh(browGeo, browMat);
    this.leftEyebrow.position.set(-0.16, 0.35, 0.4);
    this.leftEyebrow.rotation.z = -0.05;
    this.headGroup.add(this.leftEyebrow);

    this.rightEyebrow = new THREE.Mesh(browGeo, browMat);
    this.rightEyebrow.position.set(0.16, 0.35, 0.4);
    this.rightEyebrow.rotation.z = 0.05;
    this.headGroup.add(this.rightEyebrow);
  }

  private buildMouth() {
    // دهان و لب‌های لطیف با قابلیت حرکت سه‌بعدی برای LipSync
    const lipMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6, // صورتی طبیعی و نرم لب
      roughness: 0.35,
    });

    const upperLipGeo = new THREE.SphereGeometry(0.06, 16, 12);
    upperLipGeo.scale(1.8, 0.45, 0.6);
    this.upperLip = new THREE.Mesh(upperLipGeo, lipMat);
    this.upperLip.position.set(0, 0.07, 0.41);
    this.headGroup.add(this.upperLip);

    const lowerLipGeo = new THREE.SphereGeometry(0.06, 16, 12);
    lowerLipGeo.scale(1.7, 0.55, 0.6);
    this.lowerLip = new THREE.Mesh(lowerLipGeo, lipMat);
    this.lowerLip.position.set(0, 0.04, 0.41);
    this.headGroup.add(this.lowerLip);

    // حفره دهان برای هنگام باز شدن لب‌ها در تکلم
    const cavityGeo = new THREE.SphereGeometry(0.05, 12, 12);
    cavityGeo.scale(1.5, 0.8, 0.6);
    const cavityMat = new THREE.MeshBasicMaterial({ color: 0x3d101c });
    this.mouthCavity = new THREE.Mesh(cavityGeo, cavityMat);
    this.mouthCavity.position.set(0, 0.055, 0.395);
    this.mouthCavity.scale.set(0, 0, 0); // در ابتدا پنهان
    this.headGroup.add(this.mouthCavity);
  }

  private buildCheeks() {
    // گونه‌های نرم و لطیف (تپل بودن ملایم و دلنشین شیوا)
    const cheekMat = new THREE.MeshBasicMaterial({
      color: 0xfb7185,
      transparent: true,
      opacity: 0.28,
    });
    const cheekGeo = new THREE.CircleGeometry(0.07, 16);

    this.leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
    this.leftCheek.position.set(-0.24, 0.14, 0.38);
    this.leftCheek.rotation.y = -0.3;
    this.headGroup.add(this.leftCheek);

    this.rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
    this.rightCheek.position.set(0.24, 0.14, 0.38);
    this.rightCheek.rotation.y = 0.3;
    this.headGroup.add(this.rightCheek);
  }

  private buildArms() {
    // بازوی متحرک برای ژست small_wave
    this.wavingArm = new THREE.Group();
    this.wavingArm.position.set(0.44, -0.32, 0);

    const armGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.45, 16);
    const armMat = new THREE.MeshStandardMaterial({
      color: 0xffe0cf,
      roughness: 0.5,
    });
    const forearm = new THREE.Mesh(armGeo, armMat);
    forearm.position.y = 0.22;
    this.wavingArm.add(forearm);

    // دست کوچک
    const handGeo = new THREE.SphereGeometry(0.06, 12, 12);
    const hand = new THREE.Mesh(handGeo, armMat);
    hand.position.y = 0.46;
    this.wavingArm.add(hand);

    this.wavingArm.rotation.z = Math.PI - 0.2; // به حالت آویزان در کنار بدن
    this.wavingArm.visible = false; // فقط در ژست wave نمایان می‌شود
    this.bodyGroup.add(this.wavingArm);
  }

  /**
   * اعمال تناسبات رده سنی
   */
  public applyProfile(profile: AvatarProfile) {
    this.profile = profile;

    // مقیاس سر و درشتی چشم‌ها و تپل بودن گونه‌ها بر اساس سن
    const headScale = profile.head_scale || 1.0;
    this.headGroup.scale.set(headScale, headScale, headScale);

    const eyeScale = profile.eye_size_ratio || 1.0;
    this.leftEyeball.scale.set(eyeScale, eyeScale, eyeScale);
    this.rightEyeball.scale.set(eyeScale, eyeScale, eyeScale);

    // میزان تپلی گونه‌ها
    const cheekScale = 1.0 + (profile.face_chubby || 0.3) * 0.4;
    this.leftCheek.scale.set(cheekScale, cheekScale, cheekScale);
    this.rightCheek.scale.set(cheekScale, cheekScale, cheekScale);
  }

  /**
   * به‌روزرسانی فریم آواتار بر اساس ترنسفورم‌ها و مورف‌ها
   */
  public applyFrame(
    transform: AvatarHeadTransform,
    morphs: AvatarMorphWeights,
    shoulderOffset: number,
    waveAngle: number,
    eyeLookTarget: { x: number; y: number }
  ) {
    // ۱. زاویه و ترنسفورم سر (Head rotation)
    this.headGroup.rotation.x = transform.pitch;
    this.headGroup.rotation.y = transform.yaw;
    this.headGroup.rotation.z = transform.roll;
    this.headGroup.position.y = 0.22 + transform.yOffset;

    // ۲. شانه و بالاتنه
    this.leftShoulder.position.y = -0.32 + shoulderOffset;
    this.rightShoulder.position.y = -0.32 + shoulderOffset;

    // ۳. دست برای wave
    if (Math.abs(waveAngle) > 0.05) {
      this.wavingArm.visible = true;
      this.wavingArm.rotation.z = 0.5 + waveAngle;
      this.wavingArm.rotation.x = -0.3;
    } else {
      this.wavingArm.visible = false;
    }

    // ۴. پلک‌زدن (Blink Controller)
    // چرخش پلک حول محور X برای پوشاندن کره چشم
    const blinkAngle = -Math.PI / 2 + morphs.blinkLeft * (Math.PI / 2);
    this.leftEyelid.rotation.x = blinkAngle;
    this.rightEyelid.rotation.x = -Math.PI / 2 + morphs.blinkRight * (Math.PI / 2);

    // ۵. جهت نگاه چشم‌ها (Gaze direction)
    this.leftEyeball.rotation.y = eyeLookTarget.x * 0.3;
    this.leftEyeball.rotation.x = -eyeLookTarget.y * 0.2;
    this.rightEyeball.rotation.y = eyeLookTarget.x * 0.3;
    this.rightEyeball.rotation.x = -eyeLookTarget.y * 0.2;

    // ۶. دهان و هماهنگی LipSync و Expression
    const openAmount = Math.max(0, morphs.mouthOpen);
    const smileAmount = morphs.mouthSmile;
    const puckerAmount = morphs.mouthPucker;
    const wideAmount = morphs.mouthWide;

    // فک پایین و لب پایین پایین می‌آید
    this.lowerLip.position.y = 0.04 - openAmount * 0.06 - morphs.jawDrop * 0.04;
    this.upperLip.position.y = 0.07 + openAmount * 0.015;

    // پهنای دهان با لبخند و واج‌ها
    const widthScale = 1.0 + smileAmount * 0.3 + wideAmount * 0.2 - puckerAmount * 0.3;
    this.upperLip.scale.x = 1.8 * widthScale;
    this.lowerLip.scale.x = 1.7 * widthScale;

    // لبخند (انحنای گوشه‌ها)
    this.upperLip.position.y += smileAmount * 0.015;
    this.lowerLip.position.y += smileAmount * 0.01;

    // حفره داخلی دهان
    if (openAmount > 0.1) {
      this.mouthCavity.scale.set(openAmount * 1.5, openAmount * 1.0, openAmount);
    } else {
      this.mouthCavity.scale.set(0, 0, 0);
    }

    // ۷. ابروها با حالت چهره (Eyebrows)
    this.leftEyebrow.position.y = 0.35 + morphs.browInnerUp * 0.04 - morphs.browDown * 0.03;
    this.rightEyebrow.position.y = 0.35 + morphs.browInnerUp * 0.04 - morphs.browDown * 0.03;
    this.leftEyebrow.rotation.z = -0.05 + morphs.browInnerUp * 0.15 - morphs.browOuterUp * 0.1;
    this.rightEyebrow.rotation.z = 0.05 - morphs.browInnerUp * 0.15 + morphs.browOuterUp * 0.1;

    // ۸. گونه‌ها با لبخند و شادی
    const cheekIntensity = 0.28 + morphs.cheekPuff * 0.25;
    (this.leftCheek.material as THREE.MeshBasicMaterial).opacity = cheekIntensity;
    (this.rightCheek.material as THREE.MeshBasicMaterial).opacity = cheekIntensity;
  }
}
