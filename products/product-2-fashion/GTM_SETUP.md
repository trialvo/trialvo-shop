# Google Tag Manager — Configuration Guide
**Container:** `GTM-WQDNF2TP`
**Project:** Graduate Fashion Shop

---

## Overview

The shop pushes structured events to `window.dataLayer`. GTM reads those events and forwards them to Facebook Pixel, GA4, and Microsoft Clarity. This guide covers the full setup.

**Events fired by the shop:**
`page_view` · `view_item` · `add_to_cart` · `begin_checkout` · `purchase` · `sign_up`

---

## Step 1 — Data Layer Variables

**Variables → New → Data Layer Variable**

| Variable Name | Data Layer Variable Name |
|---|---|
| `DL - event_id` | `event_id` |
| `DL - ecommerce.value` | `ecommerce.value` |
| `DL - ecommerce.currency` | `ecommerce.currency` |
| `DL - ecommerce.transaction_id` | `ecommerce.transaction_id` |
| `DL - ecommerce.items` | `ecommerce.items` |
| `DL - ecommerce.num_items` | `ecommerce.num_items` |

---

## Step 2 — Triggers

**Triggers → New**

| Trigger Name | Type | Event Name |
|---|---|---|
| `All Pages` | Page View | — |
| `Trigger - purchase` | Custom Event | `purchase` |
| `Trigger - add_to_cart` | Custom Event | `add_to_cart` |
| `Trigger - view_item` | Custom Event | `view_item` |
| `Trigger - begin_checkout` | Custom Event | `begin_checkout` |
| `Trigger - sign_up` | Custom Event | `sign_up` |

---

## Step 3 — Tags

### 🔵 Facebook Pixel — Base Tag
**Tags → New → Custom HTML**
- **Name:** `FB Pixel - Base`
- **Trigger:** `All Pages`

```html
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
```
> Replace `YOUR_PIXEL_ID` with your actual Pixel ID from Meta Events Manager.

---

### 🔵 Facebook Pixel — Purchase
**Tags → New → Custom HTML**
- **Name:** `FB Pixel - Purchase`
- **Trigger:** `Trigger - purchase`

```html
<script>
fbq('track', 'Purchase', {
  value:       {{DL - ecommerce.value}},
  currency:    {{DL - ecommerce.currency}} || 'BDT',
  num_items:   {{DL - ecommerce.num_items}},
  order_id:    {{DL - ecommerce.transaction_id}}
}, {
  eventID: {{DL - event_id}}
});
</script>
```
> `eventID` enables deduplication with server-side CAPI — do not remove it.

---

### 🔵 Facebook Pixel — AddToCart
**Tags → New → Custom HTML**
- **Name:** `FB Pixel - AddToCart`
- **Trigger:** `Trigger - add_to_cart`

```html
<script>
fbq('track', 'AddToCart', {
  value:    {{DL - ecommerce.value}},
  currency: {{DL - ecommerce.currency}} || 'BDT'
}, {
  eventID: {{DL - event_id}}
});
</script>
```

---

### 🔵 Facebook Pixel — InitiateCheckout
**Tags → New → Custom HTML**
- **Name:** `FB Pixel - InitiateCheckout`
- **Trigger:** `Trigger - begin_checkout`

```html
<script>
fbq('track', 'InitiateCheckout', {
  value:     {{DL - ecommerce.value}},
  currency:  {{DL - ecommerce.currency}} || 'BDT',
  num_items: {{DL - ecommerce.num_items}}
}, {
  eventID: {{DL - event_id}}
});
</script>
```

---

### 🔵 Facebook Pixel — ViewContent
**Tags → New → Custom HTML**
- **Name:** `FB Pixel - ViewContent`
- **Trigger:** `Trigger - view_item`

```html
<script>
fbq('track', 'ViewContent', {
  value:        {{DL - ecommerce.value}},
  currency:     {{DL - ecommerce.currency}} || 'BDT',
  content_type: 'product'
}, {
  eventID: {{DL - event_id}}
});
</script>
```

---

### 🔵 Facebook Pixel — CompleteRegistration
**Tags → New → Custom HTML**
- **Name:** `FB Pixel - CompleteRegistration`
- **Trigger:** `Trigger - sign_up`

```html
<script>
fbq('track', 'CompleteRegistration', {}, {
  eventID: {{DL - event_id}}
});
</script>
```

---

### 🟡 GA4 — Configuration Tag
**Tags → New → Google Analytics: GA4 Configuration**
- **Name:** `GA4 - Config`
- **Measurement ID:** `G-XXXXXXXXXX` ← your GA4 ID
- **Trigger:** `All Pages`

---

### 🟡 GA4 — Purchase Event
**Tags → New → Google Analytics: GA4 Event**
- **Name:** `GA4 - Purchase`
- **Configuration Tag:** select `GA4 - Config`
- **Event Name:** `purchase`
- **Trigger:** `Trigger - purchase`
- **Event Parameters:**

| Parameter | Value |
|---|---|
| `transaction_id` | `{{DL - ecommerce.transaction_id}}` |
| `value` | `{{DL - ecommerce.value}}` |
| `currency` | `{{DL - ecommerce.currency}}` |
| `items` | `{{DL - ecommerce.items}}` |

---

### 🟡 GA4 — Other Ecommerce Events
Repeat the GA4 Event tag for each:

| Tag Name | Event Name | Trigger |
|---|---|---|
| `GA4 - AddToCart` | `add_to_cart` | `Trigger - add_to_cart` |
| `GA4 - ViewItem` | `view_item` | `Trigger - view_item` |
| `GA4 - BeginCheckout` | `begin_checkout` | `Trigger - begin_checkout` |
| `GA4 - SignUp` | `sign_up` | `Trigger - sign_up` |

Include `value`, `currency`, `items` parameters on each.

---

### 🟣 Microsoft Clarity
**Tags → New → Custom HTML**
- **Name:** `Clarity - Init`
- **Trigger:** `All Pages`

```html
<script type="text/javascript">
(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "YOUR_CLARITY_PROJECT_ID");
</script>
```
> Replace `YOUR_CLARITY_PROJECT_ID` with the ID from [clarity.microsoft.com](https://clarity.microsoft.com).

---

## Step 4 — Test Before Publishing

1. Click **Preview** (top right in GTM)
2. Enter your shop URL and click **Connect**
3. Browse the site — add a product to cart, go to checkout
4. In the Tag Assistant panel, verify each event fires the correct tags
5. Check **Facebook Pixel Helper** Chrome extension shows events

---

## Step 5 — Publish

1. Click **Submit**
2. Version Name: `v1 - Initial analytics setup`
3. Click **Publish**

---

## Credentials Checklist

| Credential | Where to find it | Where to set it |
|---|---|---|
| `GTM_ID` | GTM container settings | Admin → Analytics Settings → GTM |
| Facebook `Pixel ID` | Meta Events Manager → your Pixel → Settings | Admin → Analytics Settings → Facebook Pixel |
| Facebook `CAPI Access Token` | Meta Events Manager → your Pixel → Settings → Generate access token | Admin → Analytics Settings → Facebook Pixel → Conversion API |
| GA4 `Measurement ID` | GA4 → Admin → Data Streams | Admin → Analytics Settings → Google Analytics |
| Clarity `Project ID` | clarity.microsoft.com → your project | Admin → Analytics Settings → Microsoft Clarity |
