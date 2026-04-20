# API Reference / Referencia de API

Complete API documentation for CAPTCHA Shield endpoints.

Documentación completa de la API para los endpoints de CAPTCHA Shield.

---

## Base URL

```
Production: https://your-domain.com
Development: http://localhost:3000
```

---

## Endpoints

### 1. Generate Challenge / Generar Desafío

```
POST /api/captcha
```

Creates a new CAPTCHA session with a randomly selected challenge type.

Crea una nueva sesión de CAPTCHA con un tipo de desafío seleccionado aleatoriamente.

#### Request Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Content-Type | string | Yes | Must be `application/json` |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sessionId | string | Yes | Unique session identifier (UUID v4) |

#### Response (200 OK)

| Field | Type | Description |
|-------|------|-------------|
| id | string | Internal CAPTCHA ID (used for verification) |
| sessionId | string | Echo of the provided session ID |
| challengeType | string | One of: `puzzle`, `image_select`, `math_visual`, `pattern_trace` |
| challengeData | object | Challenge configuration (varies by type) |
| createdAt | string | ISO 8601 creation timestamp |
| expiresAt | string | ISO 8601 expiration timestamp (5 min) |

#### Challenge Data Structures

**Puzzle Challenge:**
```json
{
  "type": "puzzle",
  "targetX": 52.3,
  "pieceX": 8.1,
  "tolerance": 5,
  "puzzleImage": "...",
  "pieceImage": "..."
}
```

**Image Select Challenge:**
```json
{
  "type": "image_select",
  "instruction": "Selecciona todas las figuras con bordes curvos",
  "grid": [
    { "id": 0, "shape": "circle", "color": "#ef4444", "rotation": 15, "distorted": false, "hasCurvedEdges": true, "size": 30 }
  ],
  "correctIndices": [0, 2, 5, 8],
  "noiseLevel": 0.5
}
```

**Math Visual Challenge:**
```json
{
  "type": "math_visual",
  "equation": "(3 × 7) - 4",
  "answer": 17,
  "noiseLines": 5,
  "distortion": 0.3
}
```

**Pattern Trace Challenge:**
```json
{
  "type": "pattern_trace",
  "points": [
    { "id": 0, "x": 25.5, "y": 30.2 },
    { "id": 1, "x": 70.1, "y": 45.8 }
  ],
  "connections": [[0, 1], [1, 2]],
  "sequence": [0, 1, 2, 3],
  "totalTimeLimit": 15000
}
```

#### Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `Se requiere un ID de sesión` | Missing sessionId |
| 500 | `Error al generar el CAPTCHA` | Server error |

---

### 2. Verify Answer / Verificar Respuesta

```
POST /api/captcha/verify
```

Verifies the user's answer and performs behavioral analysis.

Verifica la respuesta del usuario y realiza análisis comportamental.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| captchaId | string | Yes | The CAPTCHA `id` from the generate response |
| sessionId | string | No | Session identifier |
| response | object | Yes | User's answer (structure varies by challenge type) |
| behavioralData | object | No | Collected behavioral data |

#### Response Types

**Puzzle Response:**
```json
{ "response": { "value": 52.8, "tolerance": 5 } }
```

**Image Select Response:**
```json
{ "response": { "selectedIndices": [0, 2, 5, 8] } }
```

**Math Visual Response:**
```json
{ "response": { "answer": "17" } }
```

**Pattern Trace Response:**
```json
{ "response": { "sequence": [0, 1, 2, 3] } }
```

#### Behavioral Data Structure

```json
{
  "mouseMovements": [
    { "x": 120, "y": 340, "t": 150 }
  ],
  "clicks": [
    { "x": 300, "y": 200, "t": 3200 }
  ],
  "scrollEvents": [
    { "y": 150, "t": 5000 }
  ],
  "startTime": 1704067200000,
  "submitTime": 1704067205000,
  "challengeType": "puzzle",
  "totalInteractions": 3
}
```

#### Response (200 OK)

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether verification passed |
| riskScore | number | Composite behavioral risk score (0.0 - 1.0) |
| message | string | Human-readable result message |
| signals | array | Array of individual signal scores |

#### Signal Object

| Field | Type | Description |
|-------|------|-------------|
| name | string | Signal identifier |
| score | number | Individual signal score (0.0 - 1.0) |
| weight | number | Weight in composite score |
| description | string | Human-readable explanation |

#### Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `Datos de verificación incompletos` | Missing required fields |
| 400 | `CAPTCHA expirado` | Session expired (> 5 min) |
| 400 | `CAPTCHA ya verificado` | Already verified (single-use) |
| 404 | `Sesión de CAPTCHA no encontrada` | Invalid captchaId |

---

### 3. Analytics / Analíticas

```
GET /api/captcha/analytics
```

Returns aggregate statistics for the admin dashboard.

Devuelve estadísticas agregadas para el panel de administración.

#### Response (200 OK)

```json
{
  "totalSessions": 142,
  "verifiedSessions": 98,
  "successRate": 69,
  "totalAttempts": 187,
  "successfulAttempts": 98,
  "failedAttempts": 89,
  "averageRiskScore": 0.35,
  "challengeTypeDistribution": [
    { "type": "puzzle", "count": 38 },
    { "type": "image_select", "count": 35 },
    { "type": "math_visual", "count": 36 },
    { "type": "pattern_trace", "count": 33 }
  ],
  "recentLogs": [
    {
      "id": "...",
      "action": "success",
      "challengeType": "puzzle",
      "score": 0.23,
      "createdAt": "2025-04-20T13:00:00.000Z"
    }
  ]
}
```

---

## Rate Limiting / Limitación de Tasa

> Note: Rate limiting is not built into the current version but can be implemented using middleware.

> Nota: La limitación de tasa no está integrada en la versión actual pero puede implementarse usando middleware.

Recommended limits:

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/captcha | 10 | 1 min |
| POST /api/captcha/verify | 20 | 1 min |
| GET /api/captcha/analytics | 60 | 1 min |
