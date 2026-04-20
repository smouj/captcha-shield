# Behavioral Analysis Engine / Motor de Análisis Comportamental

This document provides a deep technical explanation of CAPTCHA Shield's behavioral analysis engine — the core technology that distinguishes humans from bots.

Este documento proporciona una explicación técnica profunda del motor de análisis comportamental de CAPTCHA Shield — la tecnología central que distingue a humanos de bots.

---

## Overview / Visión General

The behavioral analysis engine collects and processes user interaction data during CAPTCHA solving to determine whether the user is human or automated. It uses 6 independent signals, each weighted according to its discriminative power, to produce a composite risk score.

El motor de análisis comportamental recopila y procesa datos de interacción del usuario durante la resolución del CAPTCHA para determinar si el usuario es humano o automatizado. Utiliza 6 señales independientes, cada una ponderada según su poder discriminativo, para producir una puntuación de riesgo compuesta.

---

## Signal 1: Path Linearity / Linealidad de Trayectoria

**Weight: 20%**

### Concept
Bots typically move the cursor in perfectly straight lines between interactive elements. Humans naturally follow curved paths due to the biomechanics of arm/wrist movement.

Los bots típicamente mueven el cursor en líneas perfectamente rectas entre elementos interactivos. Los humanos siguen naturalmente caminos curvos debido a la biomecánica del movimiento de brazo/muñeca.

### Algorithm
```
1. Calculate total path length (sum of distances between consecutive points)
2. Calculate straight-line distance from first to last point
3. linearity = straightLine / pathLength
4. riskScore = max(0, min(1, (linearity - 0.5) × 2))
```

### Interpretation
| Linearity | Risk Score | Interpretation |
|-----------|------------|----------------|
| > 0.95 | > 0.90 | Almost certainly a bot |
| 0.70-0.95 | 0.40-0.90 | Suspicious, likely automated |
| 0.50-0.70 | 0.00-0.40 | Normal human variation |
| < 0.50 | 0.00 | Very natural movement |

---

## Signal 2: Timing Consistency / Consistencia Temporal

**Weight: 20%**

### Concept
Bots execute actions at perfectly consistent intervals. Humans have naturally variable timing due to cognitive processing, attention shifts, and motor control variability.

Los bots ejecutan acciones en intervalos perfectamente consistentes. Los humanos tienen una variabilidad temporal natural debido al procesamiento cognitivo, cambios de atención y variabilidad en el control motor.

### Algorithm
```
1. Collect time intervals between mouse samples (every 10th point) and click events
2. Calculate Coefficient of Variation (CV): CV = stdDev / mean
3. Bot CV: 0.05 - 0.15 | Human CV: 0.3 - 1.5
4. riskScore = max(0, min(1, 1 - CV / 1.5))
```

### Interpretation
| CV | Risk Score | Interpretation |
|----|------------|----------------|
| < 0.15 | > 0.90 | Machine-like consistency |
| 0.15-0.30 | 0.80-0.90 | Suspicious regularity |
| 0.30-0.80 | 0.47-0.80 | Normal human range |
| > 0.80 | < 0.47 | Very natural variation |

---

## Signal 3: Speed Variance / Varianza de Velocidad

**Weight: 15%**

### Concept
Automated tools maintain constant cursor speed. Humans naturally accelerate and decelerate — speeding up during confident movements and slowing down for precision targeting.

Las herramientas automatizadas mantienen una velocidad de cursor constante. Los humanos naturalmente aceleran y desaceleran — aumentando la velocidad durante movimientos confiados y disminuyéndola para apuntar con precisión.

### Algorithm
```
1. Calculate instantaneous speed between consecutive mouse samples
2. Compute Coefficient of Variation of speeds
3. riskScore = max(0, min(1, 1 - CV / 1.2))
```

---

## Signal 4: Hesitation Patterns / Patrones de Hesitación

**Weight: 25% (highest)**

### Concept
This is the most discriminative signal. Bots execute actions immediately without pausing. Humans naturally exhibit hesitation patterns — brief pauses before clicking, between interactions, and when making decisions.

Esta es la señal más discriminativa. Los bots ejecutan acciones inmediatamente sin pausar. Los humanos exhiben naturalmente patrones de hesitación — pausas breves antes de hacer clic, entre interacciones y al tomar decisiones.

### Algorithm
```
1. Check total completion time:
   - < 500ms → riskScore = 0.9 (impossible for humans)
   - < 2000ms → riskScore = 0.85
   - < 3000ms → riskScore = 0.6
2. Count pauses in mouse movement (> 200ms gap)
3. Count hesitation before clicks (> 100ms gap before click)
4. Expected pauses = totalTime / 3000ms
5. pauseRatio = totalPauses / expectedPauses
6. If totalPauses == 0 && totalTime > 5000ms → riskScore = 0.7
7. Otherwise: riskScore = max(0, min(1, 1 - pauseRatio × 0.5))
```

---

## Signal 5: Movement Entropy / Entropía de Movimiento

**Weight: 10%**

### Concept
Shannon entropy measures the unpredictability of a distribution. Bot movements are highly predictable (low entropy) because they follow programmed paths. Human movements cover a wider, more unpredictable spatial distribution.

La entropía de Shannon mide la imprevisibilidad de una distribución. Los movimientos de bots son altamente predecibles (baja entropía) porque siguen caminos programados. Los movimientos humanos cubren una distribución espacial más amplia e impredecible.

### Algorithm
```
1. Discretize mouse X and Y positions into 20 bins each
2. Calculate Shannon entropy for each axis:
   H = -Σ (p_i × log2(p_i)) for each bin i where p_i > 0
3. Normalize against maximum entropy (log2(20) ≈ 4.32)
4. riskScore = max(0, min(1, 1 - normalizedEntropy))
```

---

## Signal 6: Bezier Curve Fit / Ajuste de Curva Bézier

**Weight: 10%**

### Concept
Human arm movements follow natural Bezier-like curves due to the kinematic chain of shoulder → elbow → wrist → fingers. Bots typically generate movements from linear interpolation or simple parametric curves.

Los movimientos del brazo humano siguen curvas naturales tipo Bézier debido a la cadena cinemática de hombro → codo → muñeca → dedos. Los bots típicamente generan movimientos a partir de interpolación lineal o curvas paramétricas simples.

### Algorithm
```
1. Sample mouse points at regular intervals
2. For each triple of consecutive points, calculate curvature:
   - Compute vectors v1 = p[i] - p[i-1] and v2 = p[i+1] - p[i]
   - Curvature = |v1 × v2| / (|v1| × |v2|)
3. Average curvature across all triples
4. riskScore = max(0, min(1, 1 - avgCurvature × 2))
```

---

## Composite Risk Score / Puntuación de Riesgo Compuesta

### Formula
```
riskScore = Σ (signal.score × signal.weight) / Σ (signal.weight)
```

### Decision Matrix / Matriz de Decisión

| Risk Score | Classification | Action |
|------------|---------------|--------|
| 0.00 - 0.30 | Clearly Human | Accept with confidence |
| 0.30 - 0.50 | Likely Human | Accept (standard) |
| 0.50 - 0.70 | Suspicious | Accept but flag |
| 0.70 - 0.85 | Likely Bot | Reject |
| 0.85 - 1.00 | Clearly Bot | Reject with confidence |

### Current Threshold
The system currently rejects all verifications with `riskScore > 0.70`. This threshold can be adjusted in `src/app/api/captcha/verify/route.ts`.

El sistema actualmente rechaza todas las verificaciones con `riskScore > 0.70`. Este umbral puede ajustarse en `src/app/api/captcha/verify/route.ts`.

---

## Anti-Evasion Considerations / Consideraciones Anti-Evasión

The engine is designed to be resistant to common bot evasion techniques:

El motor está diseñado para ser resistente a técnicas comunes de evasión de bots:

| Evasion Technique | Countermeasure |
|-------------------|----------------|
| Adding random noise to mouse paths | Entropy analysis detects artificial noise patterns |
| Adding random delays | Hesitation scoring checks for natural pause distribution, not just delay |
| Bezier path simulation | Combined with 5 other signals; simulating all simultaneously is extremely difficult |
| Headless browser automation | Canvas rendering + timing analysis + entropy make this unreliable |
| AI agent tool use | Multiple independent behavioral signals create a high bar for realistic simulation |

---

## Future Improvements / Mejoras Futuras

- **Keystroke dynamics**: Analyze typing patterns for text-based challenges
- **Device fingerprinting**: Canvas fingerprint, WebGL, font detection
- **Machine learning model**: Train a classifier on labeled human/bot data
- **Adaptive difficulty**: Increase challenge complexity for suspicious users
- **Rate limiting**: Per-IP and per-session rate limits
- **Distributed analysis**: Share behavioral patterns across instances
