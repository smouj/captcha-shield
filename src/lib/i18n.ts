/**
 * CAPTCHA Shield v4.0 "Fortress" — Internationalization System
 * 
 * Supports 8 languages with automatic detection.
 * All user-facing strings are defined here.
 */

import { LanguageCode, TranslationStrings, ChallengeType } from './types';

// Re-export LanguageCode so consumers can import it from this module
export type { LanguageCode } from './types';

const translations: Record<LanguageCode, TranslationStrings> = {
  en: {
    widgetTitle: 'CAPTCHA Shield',
    verifyButton: 'I am human',
    successMessage: 'Verified successfully',
    failMessage: 'Verification failed. Please try again.',
    cooldownMessage: 'Too many attempts. Please wait.',
    challenges: {
      [ChallengeType.ADVERSARIAL_PUZZLE]: {
        title: 'Adversarial Puzzle',
        instruction: 'Drag the puzzle pieces to their correct positions',
        successFeedback: 'Puzzle completed correctly',
        errorFeedback: 'Puzzle pieces not in correct positions',
      },
      [ChallengeType.HUMAN_INTUITION_GRID]: {
        title: 'Human Intuition',
        instruction: 'Select the image that feels out of place',
        successFeedback: 'Correct! You identified the odd one',
        errorFeedback: 'That was not the odd one out',
      },
      [ChallengeType.PHYSICS_CHAOS]: {
        title: 'Physics Balance',
        instruction: 'Drag the objects until the scale balances perfectly',
        successFeedback: 'Perfectly balanced!',
        errorFeedback: 'The scale is not balanced yet',
      },
      [ChallengeType.TEMPORAL_MEMORY]: {
        title: 'Memory Sequence',
        instruction: 'Watch the sequence, then repeat it in order',
        successFeedback: 'Sequence matched perfectly',
        errorFeedback: 'Sequence did not match',
      },
      [ChallengeType.OPTICAL_ILLUSION_MAZE]: {
        title: 'Illusion Maze',
        instruction: 'Navigate through the maze — trust your eyes, not the illusions',
        successFeedback: 'You found the exit!',
        errorFeedback: 'Wrong path — the illusions tricked you',
      },
      [ChallengeType.VOICE_RHYTHM]: {
        title: 'Voice Rhythm',
        instruction: 'Listen to the pattern and repeat the rhythm',
        successFeedback: 'Rhythm matched!',
        errorFeedback: 'Rhythm did not match the pattern',
      },
      [ChallengeType.GESTURE_SIGNATURE]: {
        title: 'Gesture Signature',
        instruction: 'Draw the shown gesture as naturally as possible',
        successFeedback: 'Natural gesture detected',
        errorFeedback: 'Gesture pattern seems automated',
      },
      [ChallengeType.CONTEXTUAL_REASONING]: {
        title: 'What Happens Next?',
        instruction: 'Look at the scene and select what would happen next',
        successFeedback: 'Correct prediction!',
        errorFeedback: 'That is not what would happen next',
      },
      [ChallengeType.LIVE_3D_BIOMETRIC]: {
        title: '3D Rotation',
        instruction: 'Rotate the object to match the target orientation',
        successFeedback: 'Rotation matched perfectly',
        errorFeedback: 'Rotation does not match the target',
      },
      [ChallengeType.ZERO_KNOWLEDGE_PROOF]: {
        title: 'Proof of Humanity',
        instruction: 'Solve the visual challenge to prove you are human',
        successFeedback: 'Humanity verified!',
        errorFeedback: 'That was not the correct answer',
      },
    },
    riskLow: 'Low risk — human detected',
    riskMedium: 'Medium risk — additional verification needed',
    riskHigh: 'High risk — enhanced verification required',
    riskCritical: 'Critical risk — blocked',
    qrScanPrompt: 'Scan with your phone to verify',
    qrCodeInput: 'Enter 6-digit code',
    qrTimer: 'Code expires in',
    accessibilityMode: 'Accessibility Mode',
    audioFallback: 'Audio Fallback',
    loading: 'Loading...',
    retry: 'Try Again',
    cancel: 'Cancel',
  },
  es: {
    widgetTitle: 'CAPTCHA Shield',
    verifyButton: 'Soy humano',
    successMessage: 'Verificación exitosa',
    failMessage: 'Verificación fallida. Inténtalo de nuevo.',
    cooldownMessage: 'Demasiados intentos. Espera un momento.',
    challenges: {
      [ChallengeType.ADVERSARIAL_PUZZLE]: {
        title: 'Puzzle Adversarial',
        instruction: 'Arrastra las piezas del puzzle a su posición correcta',
        successFeedback: 'Puzzle completado correctamente',
        errorFeedback: 'Las piezas no están en la posición correcta',
      },
      [ChallengeType.HUMAN_INTUITION_GRID]: {
        title: 'Intuición Humana',
        instruction: 'Selecciona la imagen que parece fuera de lugar',
        successFeedback: '¡Correcto! Identificaste la diferente',
        errorFeedback: 'Esa no era la diferente',
      },
      [ChallengeType.PHYSICS_CHAOS]: {
        title: 'Equilibrio Físico',
        instruction: 'Arrastra los objetos hasta equilibrar la balanza',
        successFeedback: '¡Perfectamente equilibrado!',
        errorFeedback: 'La balanza aún no está equilibrada',
      },
      [ChallengeType.TEMPORAL_MEMORY]: {
        title: 'Secuencia de Memoria',
        instruction: 'Observa la secuencia y luego repítela en orden',
        successFeedback: 'Secuencia coincidente',
        errorFeedback: 'La secuencia no coincide',
      },
      [ChallengeType.OPTICAL_ILLUSION_MAZE]: {
        title: 'Laberinto Ilusorio',
        instruction: 'Navega por el laberinto — confía en tus ojos, no en las ilusiones',
        successFeedback: '¡Encontraste la salida!',
        errorFeedback: 'Camino incorrecto — las ilusiones te engañaron',
      },
      [ChallengeType.VOICE_RHYTHM]: {
        title: 'Ritmo de Voz',
        instruction: 'Escucha el patrón y repite el ritmo',
        successFeedback: '¡Ritmo coincidente!',
        errorFeedback: 'El ritmo no coincide con el patrón',
      },
      [ChallengeType.GESTURE_SIGNATURE]: {
        title: 'Firma de Gesto',
        instruction: 'Dibuja el gesto mostrado de la forma más natural posible',
        successFeedback: 'Gesto natural detectado',
        errorFeedback: 'El patrón del gesto parece automatizado',
      },
      [ChallengeType.CONTEXTUAL_REASONING]: {
        title: '¿Qué Pasa Después?',
        instruction: 'Observa la escena y selecciona qué pasaría después',
        successFeedback: '¡Predicción correcta!',
        errorFeedback: 'Eso no es lo que pasaría después',
      },
      [ChallengeType.LIVE_3D_BIOMETRIC]: {
        title: 'Rotación 3D',
        instruction: 'Rota el objeto para coincidir con la orientación objetivo',
        successFeedback: 'Rotación perfecta',
        errorFeedback: 'La rotación no coincide con el objetivo',
      },
      [ChallengeType.ZERO_KNOWLEDGE_PROOF]: {
        title: 'Prueba de Humanidad',
        instruction: 'Resuelve el desafío visual para demostrar que eres humano',
        successFeedback: '¡Humanidad verificada!',
        errorFeedback: 'Esa no era la respuesta correcta',
      },
    },
    riskLow: 'Riesgo bajo — humano detectado',
    riskMedium: 'Riesgo medio — verificación adicional necesaria',
    riskHigh: 'Riesgo alto — verificación mejorada requerida',
    riskCritical: 'Riesgo crítico — bloqueado',
    qrScanPrompt: 'Escanea con tu teléfono para verificar',
    qrCodeInput: 'Ingresa código de 6 dígitos',
    qrTimer: 'El código expira en',
    accessibilityMode: 'Modo Accesibilidad',
    audioFallback: 'Alternativa de Audio',
    loading: 'Cargando...',
    retry: 'Reintentar',
    cancel: 'Cancelar',
  },
  fr: {
    widgetTitle: 'CAPTCHA Shield',
    verifyButton: "Je suis humain",
    successMessage: 'Vérification réussie',
    failMessage: 'Vérification échouée. Veuillez réessayer.',
    cooldownMessage: "Trop de tentatives. Veuillez patienter.",
    challenges: {
      [ChallengeType.ADVERSARIAL_PUZZLE]: { title: 'Puzzle Adversarial', instruction: 'Glissez les pièces du puzzle vers leur position correcte', successFeedback: 'Puzzle complété correctement', errorFeedback: 'Les pièces ne sont pas en position correcte' },
      [ChallengeType.HUMAN_INTUITION_GRID]: { title: 'Intuition Humaine', instruction: "Sélectionnez l'image qui semble déplacée", successFeedback: 'Correct! Vous avez identifié lintrus', errorFeedback: "Ce n'était pas lintrus" },
      [ChallengeType.PHYSICS_CHAOS]: { title: 'Équilibre Physique', instruction: "Glissez les objets jusqu'à équilibrer la balance", successFeedback: 'Parfaitement équilibré!', errorFeedback: "La balance n'est pas encore équilibrée" },
      [ChallengeType.TEMPORAL_MEMORY]: { title: 'Séquence Mémoire', instruction: 'Observez la séquence, puis répétez-la dans lordre', successFeedback: 'Séquence correspondante', errorFeedback: 'La séquence ne correspond pas' },
      [ChallengeType.OPTICAL_ILLUSION_MAZE]: { title: 'Labyrinthe Illusoire', instruction: 'Naviguez dans le labyrinthe — fiez-vous à vos yeux', successFeedback: 'Vous avez trouvé la sortie!', errorFeedback: 'Mauvais chemin' },
      [ChallengeType.VOICE_RHYTHM]: { title: 'Rythme Vocal', instruction: 'Écoutez le motif et répétez le rythme', successFeedback: 'Rythme correspondant!', errorFeedback: 'Le rythme ne correspond pas' },
      [ChallengeType.GESTURE_SIGNATURE]: { title: 'Signature Gestuelle', instruction: 'Dessinez le geste de manière naturelle', successFeedback: 'Geste naturel détecté', errorFeedback: 'Le motif semble automatisé' },
      [ChallengeType.CONTEXTUAL_REASONING]: { title: 'Que Se Passe-t-il Ensuite?', instruction: 'Regardez la scène et sélectionnez ce qui se passerait ensuite', successFeedback: 'Prédiction correcte!', errorFeedback: 'Ce nest pas ce qui se passerait ensuite' },
      [ChallengeType.LIVE_3D_BIOMETRIC]: { title: 'Rotation 3D', instruction: "Faites pivoter l'objet pour correspondre à lorientation cible", successFeedback: 'Rotation parfaite', errorFeedback: 'La rotation ne correspond pas' },
      [ChallengeType.ZERO_KNOWLEDGE_PROOF]: { title: 'Preuve dHumanité', instruction: 'Résolvez le défi visuel pour prouver que vous êtes humain', successFeedback: 'Humanité vérifiée!', errorFeedback: 'Mauvaise réponse' },
    },
    riskLow: 'Risque faible — humain détecté',
    riskMedium: 'Risque moyen — vérification supplémentaire nécessaire',
    riskHigh: 'Risque élevé — vérification renforcée requise',
    riskCritical: 'Risque critique — bloqué',
    qrScanPrompt: 'Scannez avec votre téléphone pour vérifier',
    qrCodeInput: 'Entrez le code à 6 chiffres',
    qrTimer: 'Le code expire dans',
    accessibilityMode: "Mode d'Accessibilité",
    audioFallback: 'Alternative Audio',
    loading: 'Chargement...',
    retry: 'Réessayer',
    cancel: 'Annuler',
  },
  de: {
    widgetTitle: 'CAPTCHA Shield',
    verifyButton: 'Ich bin ein Mensch',
    successMessage: 'Erfolgreich verifiziert',
    failMessage: 'Verifizierung fehlgeschlagen. Bitte erneut versuchen.',
    cooldownMessage: 'Zu viele Versuche. Bitte warten.',
    challenges: {
      [ChallengeType.ADVERSARIAL_PUZZLE]: { title: 'Adversariales Puzzle', instruction: 'Ziehen Sie die Puzzleteile an die richtige Position', successFeedback: 'Puzzle korrekt abgeschlossen', errorFeedback: 'Teile sind nicht korrekt positioniert' },
      [ChallengeType.HUMAN_INTUITION_GRID]: { title: 'Menschliche Intuition', instruction: 'Wählen Sie das Bild aus, das nicht dazugehört', successFeedback: 'Richtig! Sie haben das Ungewöhnliche erkannt', errorFeedback: 'Das war nicht das Ungewöhnliche' },
      [ChallengeType.PHYSICS_CHAOS]: { title: 'Physikalisches Gleichgewicht', instruction: 'Ziehen Sie die Objekte bis die Waage ausbalanciert ist', successFeedback: 'Perfekt ausbalanciert!', errorFeedback: 'Die Waage ist noch nicht ausbalanciert' },
      [ChallengeType.TEMPORAL_MEMORY]: { title: 'Gedächtnissequenz', instruction: 'Beobachten Sie die Sequenz und wiederholen Sie sie in Reihenfolge', successFeedback: 'Sequenz stimmt überein', errorFeedback: 'Sequenz stimmt nicht überein' },
      [ChallengeType.OPTICAL_ILLUSION_MAZE]: { title: 'Illusionslabyrinth', instruction: 'Navigieren Sie durch das Labyrinth — vertrauen Sie Ihren Augen', successFeedback: 'Sie haben den Ausgang gefunden!', errorFeedback: 'Falscher Weg' },
      [ChallengeType.VOICE_RHYTHM]: { title: 'Stimmrhythmus', instruction: 'Hören Sie das Muster und wiederholen Sie den Rhythmus', successFeedback: 'Rhythmus stimmt überein!', errorFeedback: 'Rhythmus stimmt nicht überein' },
      [ChallengeType.GESTURE_SIGNATURE]: { title: 'Gestensignatur', instruction: 'Zeichnen Sie die Geste so natürlich wie möglich', successFeedback: 'Natürliche Geste erkannt', errorFeedback: 'Gestenmuster erscheint automatisiert' },
      [ChallengeType.CONTEXTUAL_REASONING]: { title: 'Was Passiert Als Nächstes?', instruction: 'Wählen Sie aus, was als Nächstes passieren würde', successFeedback: 'Korrekte Vorhersage!', errorFeedback: 'Das würde nicht als Nächstes passieren' },
      [ChallengeType.LIVE_3D_BIOMETRIC]: { title: '3D-Rotation', instruction: 'Drehen Sie das Objekt in die Zielorientierung', successFeedback: 'Perfekte Rotation', errorFeedback: 'Rotation stimmt nicht überein' },
      [ChallengeType.ZERO_KNOWLEDGE_PROOF]: { title: 'Menschlichkeitsnachweis', instruction: 'Lösen Sie die visuelle Herausforderung', successFeedback: 'Menschlichkeit verifiziert!', errorFeedback: 'Falsche Antwort' },
    },
    riskLow: 'Niedriges Risiko — Mensch erkannt',
    riskMedium: 'Mittleres Risiko — zusätzliche Verifizierung nötig',
    riskHigh: 'Hohes Risiko — erweiterte Verifizierung erforderlich',
    riskCritical: 'Kritisches Risiko — blockiert',
    qrScanPrompt: 'Scannen Sie mit Ihrem Handy zur Verifizierung',
    qrCodeInput: '6-stelligen Code eingeben',
    qrTimer: 'Code läuft ab in',
    accessibilityMode: 'Barrierefreiheitsmodus',
    audioFallback: 'Audio-Alternative',
    loading: 'Laden...',
    retry: 'Erneut versuchen',
    cancel: 'Abbrechen',
  },
  pt: {
    widgetTitle: 'CAPTCHA Shield',
    verifyButton: 'Sou humano',
    successMessage: 'Verificação bem-sucedida',
    failMessage: 'Verificação falhou. Tente novamente.',
    cooldownMessage: 'Muitas tentativas. Aguarde um momento.',
    challenges: {
      [ChallengeType.ADVERSARIAL_PUZZLE]: { title: 'Puzzle Adversarial', instruction: 'Arraste as peças do puzzle para a posição correta', successFeedback: 'Puzzle completado corretamente', errorFeedback: 'As peças não estão na posição correta' },
      [ChallengeType.HUMAN_INTUITION_GRID]: { title: 'Intuição Humana', instruction: 'Selecione a imagem que parece fora do lugar', successFeedback: 'Correto! Você identificou a diferente', errorFeedback: 'Essa não era a diferente' },
      [ChallengeType.PHYSICS_CHAOS]: { title: 'Equilíbrio Físico', instruction: 'Arraste os objetos até equilibrar a balança', successFeedback: 'Perfeitamente equilibrado!', errorFeedback: 'A balança ainda não está equilibrada' },
      [ChallengeType.TEMPORAL_MEMORY]: { title: 'Sequência de Memória', instruction: 'Observe a sequência e repita em ordem', successFeedback: 'Sequência correspondente', errorFeedback: 'A sequência não corresponde' },
      [ChallengeType.OPTICAL_ILLUSION_MAZE]: { title: 'Labirinto Ilusório', instruction: 'Navegue pelo labirinto — confie nos seus olhos', successFeedback: 'Você encontrou a saída!', errorFeedback: 'Caminho errado' },
      [ChallengeType.VOICE_RHYTHM]: { title: 'Ritmo de Voz', instruction: 'Ouça o padrão e repita o ritmo', successFeedback: 'Ritmo correspondente!', errorFeedback: 'O ritmo não corresponde ao padrão' },
      [ChallengeType.GESTURE_SIGNATURE]: { title: 'Assinatura de Gesto', instruction: 'Desenhe o gesto da forma mais natural possível', successFeedback: 'Gesto natural detectado', errorFeedback: 'O padrão do gesto parece automatizado' },
      [ChallengeType.CONTEXTUAL_REASONING]: { title: 'O Que Acontece Depois?', instruction: 'Observe a cena e selecione o que aconteceria depois', successFeedback: 'Predição correta!', errorFeedback: 'Isso não é o que aconteceria depois' },
      [ChallengeType.LIVE_3D_BIOMETRIC]: { title: 'Rotação 3D', instruction: 'Rotacione o objeto para coincidir com a orientação alvo', successFeedback: 'Rotação perfeita', errorFeedback: 'A rotação não coincide com o alvo' },
      [ChallengeType.ZERO_KNOWLEDGE_PROOF]: { title: 'Prova de Humanidade', instruction: 'Resolva o desafio visual para provar que é humano', successFeedback: 'Humanidade verificada!', errorFeedback: 'Resposta incorreta' },
    },
    riskLow: 'Baixo risco — humano detectado',
    riskMedium: 'Risco médio — verificação adicional necessária',
    riskHigh: 'Alto risco — verificação aprimorada necessária',
    riskCritical: 'Risco crítico — bloqueado',
    qrScanPrompt: 'Escaneie com seu celular para verificar',
    qrCodeInput: 'Digite o código de 6 dígitos',
    qrTimer: 'O código expira em',
    accessibilityMode: 'Modo de Acessibilidade',
    audioFallback: 'Alternativa de Áudio',
    loading: 'Carregando...',
    retry: 'Tentar Novamente',
    cancel: 'Cancelar',
  },
  ja: {
    widgetTitle: 'CAPTCHA Shield',
    verifyButton: '私は人間です',
    successMessage: '認証成功',
    failMessage: '認証に失敗しました。もう一度お試しください。',
    cooldownMessage: '試行回数が多すぎます。お待ちください。',
    challenges: {
      [ChallengeType.ADVERSARIAL_PUZZLE]: { title: 'アドバーサリアルパズル', instruction: 'パズルのピースを正しい位置にドラッグしてください', successFeedback: 'パズル完了', errorFeedback: 'ピースが正しい位置にありません' },
      [ChallengeType.HUMAN_INTUITION_GRID]: { title: '人間の直感', instruction: '場違いな画像を選択してください', successFeedback: '正解！奇異なものを見つけました', errorFeedback: 'それは奇異なものではありません' },
      [ChallengeType.PHYSICS_CHAOS]: { title: '物理バランス', instruction: 'オブジェクトをドラッグしてバランスを取ってください', successFeedback: '完璧なバランス！', errorFeedback: 'まだバランスが取れていません' },
      [ChallengeType.TEMPORAL_MEMORY]: { title: '記憶シーケンス', instruction: 'シーケンスを観察し、順番に繰り返してください', successFeedback: 'シーケンス一致', errorFeedback: 'シーケンスが一致しません' },
      [ChallengeType.OPTICAL_ILLUSION_MAZE]: { title: '錯覚迷路', instruction: '迷路をナビゲートしてください', successFeedback: '出口を見つけました！', errorFeedback: '間違った道です' },
      [ChallengeType.VOICE_RHYTHM]: { title: 'ボイスリズム', instruction: 'パターンを聞いてリズムを繰り返してください', successFeedback: 'リズム一致！', errorFeedback: 'リズムが一致しません' },
      [ChallengeType.GESTURE_SIGNATURE]: { title: 'ジェスチャーサイン', instruction: '示されたジェスチャーを自然に描いてください', successFeedback: '自然なジェスチャーを検出', errorFeedback: 'ジェスチャーが自動化されているようです' },
      [ChallengeType.CONTEXTUAL_REASONING]: { title: '次は何が起こる？', instruction: 'シーンを見て次に起こることを選択してください', successFeedback: '正しい予測！', errorFeedback: 'それは次に起こることではありません' },
      [ChallengeType.LIVE_3D_BIOMETRIC]: { title: '3D回転', instruction: 'オブジェクトを回転してターゲットの向きに合わせてください', successFeedback: '完璧な回転', errorFeedback: '回転がターゲットと一致しません' },
      [ChallengeType.ZERO_KNOWLEDGE_PROOF]: { title: '人間性の証明', instruction: 'ビジュアルチャレンジを解いて人間であることを証明してください', successFeedback: '人間性確認！', errorFeedback: '不正解' },
    },
    riskLow: '低リスク — 人間を検出',
    riskMedium: '中リスク — 追加認証が必要',
    riskHigh: '高リスク — 強化認証が必要',
    riskCritical: '危険リスク — ブロック済み',
    qrScanPrompt: 'スマホでスキャンして認証',
    qrCodeInput: '6桁のコードを入力',
    qrTimer: 'コードの有効期限',
    accessibilityMode: 'アクセシビリティモード',
    audioFallback: '音声フォールバック',
    loading: '読み込み中...',
    retry: '再試行',
    cancel: 'キャンセル',
  },
  zh: {
    widgetTitle: 'CAPTCHA Shield',
    verifyButton: '我是人类',
    successMessage: '验证成功',
    failMessage: '验证失败，请重试。',
    cooldownMessage: '尝试次数过多，请稍候。',
    challenges: {
      [ChallengeType.ADVERSARIAL_PUZZLE]: { title: '对抗性拼图', instruction: '将拼图块拖动到正确位置', successFeedback: '拼图完成', errorFeedback: '拼图块位置不正确' },
      [ChallengeType.HUMAN_INTUITION_GRID]: { title: '人类直觉', instruction: '选择看起来不合适的图片', successFeedback: '正确！你找到了不同寻常的', errorFeedback: '那不是不同寻常的' },
      [ChallengeType.PHYSICS_CHAOS]: { title: '物理平衡', instruction: '拖动物体直到天平平衡', successFeedback: '完美平衡！', errorFeedback: '天平还未平衡' },
      [ChallengeType.TEMPORAL_MEMORY]: { title: '记忆序列', instruction: '观察序列，然后按顺序重复', successFeedback: '序列匹配', errorFeedback: '序列不匹配' },
      [ChallengeType.OPTICAL_ILLUSION_MAZE]: { title: '幻觉迷宫', instruction: '在迷宫中导航', successFeedback: '你找到了出口！', errorFeedback: '错误的路径' },
      [ChallengeType.VOICE_RHYTHM]: { title: '语音节奏', instruction: '听模式并重复节奏', successFeedback: '节奏匹配！', errorFeedback: '节奏不匹配' },
      [ChallengeType.GESTURE_SIGNATURE]: { title: '手势签名', instruction: '尽可能自然地画出所示手势', successFeedback: '检测到自然手势', errorFeedback: '手势模式似乎是自动化的' },
      [ChallengeType.CONTEXTUAL_REASONING]: { title: '接下来会发生什么？', instruction: '观察场景并选择接下来会发生什么', successFeedback: '正确预测！', errorFeedback: '那不是接下来会发生的' },
      [ChallengeType.LIVE_3D_BIOMETRIC]: { title: '3D旋转', instruction: '旋转物体以匹配目标方向', successFeedback: '完美旋转', errorFeedback: '旋转与目标不匹配' },
      [ChallengeType.ZERO_KNOWLEDGE_PROOF]: { title: '人性证明', instruction: '解决视觉挑战以证明你是人类', successFeedback: '人性已验证！', errorFeedback: '答案不正确' },
    },
    riskLow: '低风险 — 检测到人类',
    riskMedium: '中等风险 — 需要额外验证',
    riskHigh: '高风险 — 需要增强验证',
    riskCritical: '极高风险 — 已阻止',
    qrScanPrompt: '用手机扫码验证',
    qrCodeInput: '输入6位代码',
    qrTimer: '代码过期时间',
    accessibilityMode: '无障碍模式',
    audioFallback: '音频备选',
    loading: '加载中...',
    retry: '重试',
    cancel: '取消',
  },
  ko: {
    widgetTitle: 'CAPTCHA Shield',
    verifyButton: '나는 인간입니다',
    successMessage: '인증 성공',
    failMessage: '인증 실패. 다시 시도해 주세요.',
    cooldownMessage: '시도 횟수 초과. 잠시 기다려 주세요.',
    challenges: {
      [ChallengeType.ADVERSARIAL_PUZZLE]: { title: '적대적 퍼즐', instruction: '퍼즐 조각을 올바른 위치로 드래그하세요', successFeedback: '퍼즐 완료', errorFeedback: '조각이 올바른 위치에 없습니다' },
      [ChallengeType.HUMAN_INTUITION_GRID]: { title: '인간 직관', instruction: '어울리지 않는 이미지를 선택하세요', successFeedback: '정답! 이상한 것을 찾았습니다', errorFeedback: '그것은 이상한 것이 아닙니다' },
      [ChallengeType.PHYSICS_CHAOS]: { title: '물리 균형', instruction: '저울이 균형을 이룰 때까지 객체를 드래그하세요', successFeedback: '완벽한 균형!', errorFeedback: '아직 균형이 맞지 않습니다' },
      [ChallengeType.TEMPORAL_MEMORY]: { title: '기억 시퀀스', instruction: '시퀀스를 관찰하고 순서대로 반복하세요', successFeedback: '시퀀스 일치', errorFeedback: '시퀀스가 일치하지 않습니다' },
      [ChallengeType.OPTICAL_ILLUSION_MAZE]: { title: '착시 미로', instruction: '미로를 탐색하세요', successFeedback: '출구를 찾았습니다!', errorFeedback: '잘못된 경로' },
      [ChallengeType.VOICE_RHYTHM]: { title: '음성 리듬', instruction: '패턴을 듣고 리듬을 반복하세요', successFeedback: '리듬 일치!', errorFeedback: '리듬이 일치하지 않습니다' },
      [ChallengeType.GESTURE_SIGNATURE]: { title: '제스처 서명', instruction: '표시된 제스처를 자연스럽게 그리세요', successFeedback: '자연스러운 제스처 감지', errorFeedback: '제스처 패턴이 자동화된 것 같습니다' },
      [ChallengeType.CONTEXTUAL_REASONING]: { title: '다음에 무슨 일이?', instruction: '장면을 보고 다음에 일어날 일을 선택하세요', successFeedback: '올바른 예측!', errorFeedback: '그것은 다음에 일어날 일이 아닙니다' },
      [ChallengeType.LIVE_3D_BIOMETRIC]: { title: '3D 회전', instruction: '객체를 회전하여 목표 방향에 맞추세요', successFeedback: '완벽한 회전', errorFeedback: '회전이 목표와 일치하지 않습니다' },
      [ChallengeType.ZERO_KNOWLEDGE_PROOF]: { title: '인간성 증명', instruction: '시각적 챌린지를 해결하여 인간임을 증명하세요', successFeedback: '인간성 확인!', errorFeedback: '오답' },
    },
    riskLow: '낮은 위험 — 인간 감지',
    riskMedium: '중간 위험 — 추가 인증 필요',
    riskHigh: '높은 위험 — 강화 인증 필요',
    riskCritical: '위험 위험 — 차단됨',
    qrScanPrompt: '휴대폰으로 스캔하여 인증',
    qrCodeInput: '6자리 코드 입력',
    qrTimer: '코드 만료 시간',
    accessibilityMode: '접근성 모드',
    audioFallback: '오디오 대체',
    loading: '로딩 중...',
    retry: '재시도',
    cancel: '취소',
  },
};

/**
 * Detect the user's preferred language from browser settings
 */
export function detectLanguage(): LanguageCode {
  if (typeof navigator === 'undefined') return 'en';
  
  const supported: LanguageCode[] = ['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'ko'];
  const browserLangs = navigator.languages || [navigator.language];
  
  for (const lang of browserLangs) {
    const code = lang.split('-')[0].toLowerCase() as LanguageCode;
    if (supported.includes(code)) return code;
  }
  
  return 'en';
}

/**
 * Get translations for a specific language
 */
export function getTranslations(lang: LanguageCode): TranslationStrings {
  return translations[lang] || translations.en;
}

/**
 * Get a specific challenge translation
 */
export function getChallengeTranslation(
  lang: LanguageCode,
  challengeType: ChallengeType
): { title: string; instruction: string; successFeedback: string; errorFeedback: string } {
  const t = getTranslations(lang);
  return t.challenges[challengeType] || translations.en.challenges[challengeType];
}

/**
 * Get all supported language codes
 */
export function getSupportedLanguages(): LanguageCode[] {
  return ['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'ko'];
}

/**
 * Get language display name
 */
export function getLanguageName(code: LanguageCode): string {
  const names: Record<LanguageCode, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    pt: 'Português',
    ja: '日本語',
    zh: '中文',
    ko: '한국어',
  };
  return names[code];
}

export { translations };
