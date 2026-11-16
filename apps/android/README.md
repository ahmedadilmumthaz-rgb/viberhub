# Viber Hub Android Companion (Kotlin)

## Architecture & Integration Principles

The Android Companion facilitates operator-led messaging directly from an Android mobile device.

### Supported Android Mechanism: Share Sheet Intent
In accordance with Viber's Fair Usage Policy, Android handoff operates through standard, official Android framework APIs:

```kotlin
// Android Intent handoff snippet
val shareIntent = Intent(Intent.ACTION_SEND).apply {
    type = "text/plain"
    putExtra(Intent.EXTRA_TEXT, preparedMessageText)
    // Target Viber official package
    setPackage("com.viber.voip")
}
context.startActivity(Intent.createChooser(shareIntent, "Handoff to Viber"))
```

### For Image / Document Attachments:
```kotlin
val shareMediaIntent = Intent(Intent.ACTION_SEND).apply {
    type = mimeType // e.g. "image/jpeg" or "application/pdf"
    putExtra(Intent.EXTRA_STREAM, fileUri)
    putExtra(Intent.EXTRA_TEXT, preparedMessageText)
    setPackage("com.viber.voip")
    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
}
context.startActivity(shareMediaIntent)
```

### Prohibited Patterns (Strict Policy Boundary)
- Do **NOT** use Accessibility Services to automate clicks or keystrokes inside the Viber app.
- Do **NOT** inspect Viber's internal SQLite database (`/data/data/com.viber.voip/`).
- Do **NOT** extract or replay authentication tokens or credentials.
