Viber Messaging Hub — Architecture & MVP
Based on your requirements, I'd build this as a personal Viber campaign-management platform that uses your existing Viber account on both Android and Desktop.

The application would have one central dashboard for managing recipients, preparing campaigns, attaching files, scheduling messages and tracking sending activity.

Recommended architecture
 Web dashboard + Node.js backend + Android companion + Desktop companion

One architectural decision is particularly important: Android and Desktop should be treated as connected devices, not as two independent Viber accounts. Your phone number and existing account remain the identity behind the application.

At 100–500 messages per day, I would also avoid building a system that blindly sends hundreds of messages in succession. Use campaign queues, recipient validation, duplicate prevention, manual approval and account-safety controls.
1. Important platform limitation
I checked Viber's current policies and developer documentation, including its March 2026 Fair Usage Policy.

There is a significant constraint: Viber prohibits bots, scripts and automated tools from interacting with personal accounts outside approved interfaces. It also prohibits unsolicited bulk messaging. 
Viber+2


This affects the design:
- I would not implement hidden API calls, reverse-engineered protocols or unattended UI automation.
- A companion app can prepare content, manage files and launch Viber, but should leave the actual sending action to you.
- Your personal account can still be used for ordinary manual conversations.
- If you eventually need fully automated sending, you would need an approved Viber integration.
This is not just a technical consideration. It is important to avoid building a product that stops working after a Viber update or puts your account at risk.
2. Recommended system architecture
I'd use the following stack.
Component	Technology	Purpose
Frontend	Next.js + React + TypeScript	Dashboard
UI	Tailwind CSS + shadcn/ui	Modern interface
Backend	Node.js + Express	REST API
Database	PostgreSQL	Contacts, campaigns, history
ORM	Prisma	Database management
Queue	BullMQ + Redis	Campaign scheduling
File storage	MinIO	Images, PDFs, documents
Android companion	Kotlin	Prepare and share messages
Desktop companion	Electron	Local Viber handoff
Authentication	JWT + secure sessions	Admin access

This is compatible with a modern VPS deployment. I would keep the dashboard and backend separate from the companion applications.
System architecture
Next.js Dashboard

Campaigns · Contacts · Templates · Reports


Node.js API

Authentication · Validation · Campaign management

PostgreSQL
Records

MinIO
Attachments

Redis
Scheduling

Companion apps
Viber handoff



Your Viber account

Android + Desktop · Manual send confirmation


3. MVP modules
I would divide the application into eight modules.










01. Dashboard
- Total contacts and groups
- Campaign drafts and scheduled items
- Recent sending activity
- Attachment storage usage
- Device connection status





02. Contact management
- Add contacts manually
- Import CSV / Excel
- Name and Viber number
- Tags and categories
- Consent and communication preferences
- Unsubscribe / do-not-contact list













03. Message composer
- Plain text and formatted text
- Image attachments
- PDF and document attachments
- Reusable message templates
- Preview before sharing
- Personalization placeholders such as {name}













04. Campaign management
- Create and save drafts
- Organize intended recipients
- Preview campaign content
- Schedule preparation reminders
- Require manual approval
- Track prepared, opened and manually confirmed items
This should be a campaign organizer, not an unattended bulk sender.













05. Groups and channels
- Maintain a directory of your groups
- Maintain your channel directory
- Record your administrator permissions
- Prepare group announcements
- Prepare channel posts
- Open the relevant Viber destination for manual posting













06. Media library
- Upload images and PDFs
- Organize files into folders
- Reuse previously uploaded attachments
- Preview files
- Store file descriptions and metadata













07. Activity and reporting
- Campaign history
- Recipient-level records
- User-confirmed sending status
- Failed handoff records
- Date and time
- Export CSV reports
Do not label a message delivered or read unless Viber provides actual delivery/read confirmation.













08. Device management
- Android companion status
- Desktop companion status
- Last connected time
- Local application version
- Pairing and revocation
- Secure device authentication



4. How the sending workflow should work
The application should have a clear distinction between preparing a message and actually sending it.
1. Create a message
   
   Write your message, insert personalization fields and attach images or PDFs.
2. Select a destination
   
   Choose an existing contact, group or channel from your application directory.
3. Review
   
   Display the message exactly as it will be prepared, including its attachments and destination.
4. Open Viber
   
   The Android companion uses Android's supported sharing mechanisms where available. The Desktop companion opens the Viber application for you.
5. Confirm manually
   
   You review the destination and press Send or Post inside Viber yourself.
6. Record the activity
   
   Return to the dashboard and record whether you completed the action. This is an operator-confirmed status, not verified delivery.
This avoids pretending that an external application can reliably inspect Viber's private chats, discover all group memberships or confirm message delivery.
5. Database design
I'd start with these PostgreSQL tables:
Table	Important fields
users	id, name, email, password_hash
devices	id, user_id, platform, device_name, last_seen
contacts	id, name, phone_number, notes
contact_tags	id, name
contact_tag_assignments	contact_id, tag_id
communication_preferences	contact_id, consent_status, updated_at
destinations	id, name, type, notes
attachments	id, filename, storage_path, mime_type
templates	id, name, message_body
campaigns	id, name, status, created_at
campaign_items	id, campaign_id, destination_id, status
campaign_attachments	campaign_item_id, attachment_id
activity_logs	id, campaign_item_id, action, timestamp

For destination types, use:
- individual
- group
- community
- channel
I would keep actual Viber chat identifiers out of the initial MVP unless you have an approved integration that exposes them.
6. Desktop and Android companion applications
Desktop companion — Electron
Recommended first









mac.softpedia.com


Features:
- Connect securely to your web dashboard.
- Receive prepared messages and attachments.
- Open Viber Desktop.
- Help you locate and review the intended conversation.
- Let you manually send the content.


Android companion — Kotlin









kv.by


Features:
- Authenticate with your dashboard.
- Receive prepared messages.
- Share text, images and documents through Android's supported sharing interface.
- Launch Viber when available as a share target.
- Let you confirm the destination and send.


I would build Desktop first, followed by Android. Viber officially supports desktop synchronization with an activated phone account, although some features differ between platforms. 
Viber Support+1

7. MVP development roadmap
I'd build this in four phases.
1. Phase 1
    Web dashboard foundation
   
   First milestone
   - Authentication
   - Dashboard layout
   - Contact management
   - CSV import
   - Groups and channel directory
   - Message templates
   - Media library
2. Phase 2
    Message preparation
   - Message composer
   - Image and PDF attachments
   - Personalization
   - Campaign drafts
   - Preview and approval
   - Manual sending workflow
3. Phase 3
    Companion applications
   - Electron desktop application
   - Android application
   - Secure device pairing
   - Viber handoff
   - Device status
4. Phase 4
    Reporting and refinement
   - Activity history
   - Campaign reports
   - CSV exports
   - Scheduling reminders
   - Error handling
   - Security improvements

8. One important alternative: approved Viber integration
If your eventual objective is genuinely to send 100–500 messages every day without manually pressing Send, we should investigate Viber Business Messages or an approved Viber bot.

However, the official bot API has limitations:
- Recipients generally need to subscribe to your bot.
- Broadcast functionality requires Viber approval.
- It does not provide unrestricted access to your personal account's contacts, groups and channels.
- Creating new bots has been subject to commercial terms since February 2024. 
  Viber Developers Hub+2
See: Viber Developers.
9. What I would build first
My recommendation
Call the application Viber Hub for now.








mycrmsim.com


The initial navigation could look like this:
Viber Hub
│
├── Dashboard
│
├── Contacts
│   ├── All Contacts
│   ├── Import Contacts
│   └── Tags & Categories
│
├── Destinations
│   ├── Individual Chats
│   ├── Groups
│   ├── Communities
│   └── Channels
│
├── Messages
│   ├── Compose
│   ├── Templates
│   └── Media Library
│
├── Campaigns
│   ├── Drafts
│   ├── Pending Approval
│   └── History
│
├── Reports
│
└── Settings
    ├── Devices
    ├── Account
    └── Security


Three final architectural decisions
Before writing the actual development specification, I'd like to establish three things.
1. What is the primary purpose?

Business announcements and customer communication

Personal messages and managing my own groups

Community announcements and channel publishing

A mixture of all three


2. How many Viber accounts?

One personal Viber number

Multiple Viber numbers

One initially, but support multiple later


3. Where will you host it?

My own VPS

Shared hosting

Locally on my computer

Cloud hosting

Finalize architecture
Once these are settled, the next deliverable should be a complete technical specification and an implementation-ready prompt for building the web dashboard.