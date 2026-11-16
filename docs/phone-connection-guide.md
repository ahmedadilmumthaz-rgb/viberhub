# Connecting Your Phone & Viber Number to Viber Hub

This comprehensive guide explains how your mobile phone and Viber number connect with **Viber Hub** for seamless, operator-led messaging.

---

## 1. Core Principle: How Viber Hub Connects to Your Viber Number

Viber ties user accounts directly to a primary mobile phone number. Unlike platforms that provide open public personal-messaging APIs, Viber strictly prohibits:
- Unofficial personal account bots and headless browser automations.
- Reverse-engineering private network protocols or extracting auth tokens.
- Automated mass sending queues from personal user accounts.

Violating these rules results in immediate, permanent phone number blacklisting.

### The Viber Hub Architectural Solution
Viber Hub uses a **Connected Device & Operator Handoff Architecture**:
- Your mobile phone remains the **authoritative identity** for your Viber number.
- Viber Hub functions as your **content preparation, editorial review, and coordination workspace**.
- Content is dispatched via official OS channels (standard registered URI schemes `viber://chat?number=...`, Android ShareSheet `Intent.ACTION_SEND`, and paired desktop synchronization).
- Every dispatch is confirmed by the human operator, ensuring **100% compliance with Viber's Fair Usage Policy** with zero risk to your phone number.

```
┌────────────────────────────────────────────────────────┐
│                   VIBER HUB PLATFORM                   │
│   • Contacts & E.164 Normalization                    │
│   • Allowed Variable Interpolation ({{name}}, etc.)    │
│   • Review & Approval Governance                       │
│   • Private Authenticated Media Storage               │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
   [ METHOD A: DESKTOP ]       [ METHOD B: MOBILE PHONE ]
   • Official Viber Desktop    • Direct Mobile Browser
   • Phone synced via QR Code  • Or Android Companion App
   • 1-Click "Open in Viber"   • Native ShareSheet Intent
             │                           │
             └─────────────┬─────────────┘
                           ▼
              ┌─────────────────────────┐
              │   OFFICIAL VIBER APP    │
              │   (Your Phone Number)   │
              │  Operator clicks Send   │
              └─────────────────────────┘
```

---

## 2. Setting Up Your Connection

There are three flexible methods to connect your phone number, depending on whether you work on a computer, a smartphone, or both.

---

### Method A: Desktop Workstation Sync (Recommended)

This is the fastest and most ergonomic setup for managing communication campaigns from your Mac, Windows, or Linux workstation.

#### Step 1: Install Official Viber Desktop
1. Download and install **Viber Desktop** from the official website ([viber.com/download](https://www.viber.com/download/)).
2. Launch Viber Desktop on your computer. A QR code will appear on your screen.

#### Step 2: Link Your Phone to Viber Desktop
1. Open the **Viber app** on your mobile phone.
2. Tap the **More** tab (three dots or menu icon at the bottom).
3. Tap the **QR Code icon** in the top-right corner.
4. Point your phone camera at the QR code on your computer screen.
5. Tap **Approve / Sync** on your phone.
6. *Result:* Your Viber phone number and message history are now synchronized with your computer.

#### Step 3: Register Your Account in Viber Hub
1. Open the Viber Hub dashboard (`http://localhost:3000` or your server IP).
2. Go to **Settings** → **Viber Accounts** tab.
3. Click **Add Account Profile**:
   - **Display Name**: e.g., `Sales Support (Main)`
   - **Phone Number**: Your phone number in international format (e.g., `+1 415 555 2671` or `+44 7911 123456`).
   - **Notes**: e.g., `Primary operator phone for customer notifications`.
4. Click **Save Account Profile**.

#### Step 4: Dispatch Messages in 1 Click
1. In Viber Hub, navigate to an **Approved Campaign** ([`/campaigns/[id]`](http://localhost:3000/campaigns)).
2. In the **Operator Handoff Checklist**:
   - Click **Open in Viber** (`viber://chat?number=...`). Viber Desktop instantly focuses the direct chat with the recipient.
   - Click **Copy Text** (or let the Desktop Companion auto-copy it to your clipboard).
   - In Viber Desktop, press `Cmd+V` (Mac) or `Ctrl+V` (Windows) into the chat box, and hit Enter to send.
   - If media attachments are present, click the download icon to save and drag-and-drop into the chat.
3. In Viber Hub, click **Mark Completed Manually** to record the timestamp and operator attribution.

---

### Method B: Direct Mobile Access (No App Installation Needed)

If you operate on an iPhone or Android phone without installing companion software:

1. Open your phone's browser (Safari or Chrome).
2. Navigate to your Viber Hub server address (e.g., `http://YOUR_SERVER_IP:3000` or your custom domain).
3. Log in with your operator credentials.
4. Open the approved campaign's handoff page.
5. Tap **Open in Viber**:
   - iOS and Android will automatically prompt: *"Open this page in Viber?"*.
   - Tap **Open**. The official Viber app launches directly to the recipient's phone number!
6. Switch back to the browser, tap **Copy Text**, return to Viber, paste, and tap Send.
7. Tap **Mark Completed Manually** in Viber Hub.

---

### Method C: Android Companion App (ShareSheet Integration)

For dedicated Android devices or field operators, the Android Companion utilizes Android's native ShareSheet framework to transfer messages and media files in one tap.

#### Step 1: Pair the Android Device in Viber Hub
1. In the Viber Hub dashboard, go to **Settings** → **Connected Devices** tab.
2. Click **Pair Companion Device**:
   - **Device Name**: e.g., `Field Phone - Samsung Galaxy S23`
   - **Platform**: `Android`
3. Click **Generate Pairing Token**.
4. Copy the secure device pairing token displayed on screen (format: `vh_dev_<32_hex_chars>`).

#### Step 2: Configure the Companion Client
1. In your companion app or configuration file, set:
   ```properties
   VIBERHUB_SERVER_URL=http://YOUR_SERVER_IP:4000/api/v1
   VIBERHUB_DEVICE_TOKEN=vh_dev_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
2. The companion will authenticate with the server and poll pending handoff tasks:
   ```http
   GET /api/v1/settings/devices/pending-handoff
   Authorization: Bearer vh_dev_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

#### Step 3: Triggering Android ShareSheet to Viber
When the operator confirms a pending item, the Android companion fires a native Android `Intent` directly targeting Viber's official package:

```kotlin
// Sharing message text
val shareIntent = Intent(Intent.ACTION_SEND).apply {
    type = "text/plain"
    putExtra(Intent.EXTRA_TEXT, preparedMessageText)
    setPackage("com.viber.voip") // Targets official Viber app
}
context.startActivity(Intent.createChooser(shareIntent, "Send via Viber"))
```

For image or document attachments:
```kotlin
val mediaIntent = Intent(Intent.ACTION_SEND).apply {
    type = attachmentMimeType // e.g. "image/jpeg" or "application/pdf"
    putExtra(Intent.EXTRA_STREAM, localFileContentUri)
    putExtra(Intent.EXTRA_TEXT, preparedMessageText)
    setPackage("com.viber.voip")
    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
}
context.startActivity(Intent.createChooser(mediaIntent, "Send via Viber"))
```

The operator selects the contact or confirms the suggested target in Viber and presses Send.

---

## 3. Desktop Companion (Electron App)

If you prefer a lightweight desktop companion app instead of relying solely on the web browser:

1. Navigate to the desktop companion directory:
   ```bash
   cd apps/desktop
   ```
2. Build and launch:
   ```bash
   npm run build
   npm run start
   ```
3. The companion runs in your system tray and provides an IPC bridge (`handoff-to-viber`) that automatically:
   - Copies prepared message text to the OS clipboard.
   - Automatically invokes the system URI launcher (`viber://chat?number=...`).
   - Keeps your connection alive with regular heartbeat pings.

---

## 4. Multiple Operators & Phone Numbers

Viber Hub supports multi-operator teams. Each operator can use their own phone number:

1. **Register Each Phone Profile**:
   - In **Settings → Viber Accounts**, add an entry for each operator's phone number (e.g. `Support Line 1: +14155552671`, `Sales Line 2: +14155552672`).
2. **Assign Campaigns to Specific Operators**:
   - When creating or reviewing campaigns, assign the campaign to the operator responsible for that recipient group or region.
3. **Audited Attribution**:
   - When an operator completes a dispatch, Viber Hub records:
     - `completedByUserId`: The ID of the authenticated user.
     - `completedAt`: The ISO 8601 timestamp.
     - `completionNote`: The operator's dispatch note.

---

## 5. Security & Safety Checklist

| Feature | Viber Hub Standard | Unofficial Bots / Scrapers |
|---|---|---|
| **Account Ban Risk** | **0% (Completely safe)** | High (Instant ban risk) |
| **Viber Credentials Required?** | **None (Never shared)** | Asks for cookies/session tokens |
| **SMS Activation Codes?** | **Never requested** | Often intercepted/requested |
| **Sending Mechanism** | **Official Viber Apps** | Reverse-engineered endpoints |
| **Fair Usage Compliance** | **100% Compliant** | Violates Terms of Service |

---

## 6. Frequently Asked Questions (FAQ)

### Q: Why does the browser ask permission to open "Viber"?
When you click **Open in Viber**, the web browser asks for confirmation before opening an external application protocol (`viber://`). You can check **"Always allow"** in Chrome or Safari so future clicks launch Viber immediately.

### Q: What if `viber://chat?number=...` opens Viber, but not the specific chat?
Ensure the contact's phone number includes the international country code without spaces or dashes (e.g., `+14155552671`). Viber Hub automatically normalizes all numbers to standard **E.164** format during contact creation and CSV imports. If the recipient has never installed Viber, Viber will open to your contacts list or prompt you to send an SMS invite.

### Q: Does Viber Hub store my personal Viber chat history?
No. Viber Hub stores your **contacts, communication consent records, campaign templates, and dispatch logs**. It does not read, intercept, or access your private Viber message inbox.

### Q: Can I send images, brochures, or PDF invoices with messages?
Yes! Upload files to the **Private Media Library** ([`/media`](http://localhost:3000/media)) or attach them in the Campaign Composer. In the handoff checklist, click the **Download** icon to retrieve the file from authenticated object storage, then drag-and-drop or attach it directly into the Viber chat.
