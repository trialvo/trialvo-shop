# EPS Payment Gateway — Complete Integration Documentation

> **Source Files Combined:**
> 1. `SandBox_Credentials(Eps_Demo)/EPS Sandbox Merchant API Integration Guide_V4.docx.pdf`
> 2. `SandBox_Credentials(Eps_Demo)/SandBox_Credentials(Eps_Demo).docx` *(encrypted, password: EPS)*
> 3. `Live_Credentials(Trialvo)/EPS Merchant API Integration Guide_V5.docx.pdf`
> 4. `Live_Credentials(Trialvo)/Live_Credentials(Trialvo).docx` *(encrypted, password: EPS)*
>
> **Provider:** Easy Payment System (EPS) — [www.eps.com.bd](https://www.eps.com.bd) | info@eps.com.bd

---

## Table of Contents

1. [Credentials](#1-credentials)
2. [Hash Mechanism (x-hash)](#2-hash-mechanism-x-hash)
3. [Transaction Type IDs](#3-transaction-type-ids)
4. [API No.01 — GetToken](#4-api-no01--gettoken)
5. [API No.02 — Initialize Payment](#5-api-no02--initialize-payment)
6. [API No.03 — Verify Transaction (Check Status)](#6-api-no03--verify-transaction-check-status)
7. [Integration Flow](#7-integration-flow)
8. [Sandbox vs Live — Key Differences](#8-sandbox-vs-live--key-differences)
9. [Merchant Dashboard & Resources](#9-merchant-dashboard--resources)
10. [Footer / Branding Assets](#10-footer--branding-assets)

---

## 1. Credentials

### Sandbox (Eps_Demo)

| Field | Value |
|---|---|
| **Merchant ID** | `29e86e70-0ac6-45eb-ba04-9fcb0aaed12a` |
| **Store ID** | `d44e705f-9e3a-41de-98b1-1674631637da` |
| **User Name** | `Epsdemo@gmail.com` |
| **Password** | `Epsdemo258@` |
| **Hash Key** | `FHZxyzeps56789gfhg678ygu876o=` |
| **Base URL** | `https://sandboxpgapi.eps.com.bd/v1` |
| **Payment Page** | `https://pg.eps.com.bd/PG?data=<TransactionId>` |

### Live (Trialvo)

| Field | Value |
|---|---|
| **Merchant ID** | `0f71ad2d-2cfe-4b32-8804-918db808cd6f` |
| **Store ID** | `b3a6ac12-f3be-4d5f-b0d0-c59e322436d5` |
| **User Name** | `shafiulalam.sra@gmail.com` |
| **Password** | `Trialvo8@` |
| **Hash Key** | `FMUNISHOY2lWZEPSXTy38CF3TRIALVO` |
| **Base URL** | `https://pgapi.eps.com.bd/v1` |
| **Payment Page** | `https://pg.eps.com.bd/PG?data=<TransactionId>` |
| **Merchant Dashboard** | `https://merchant.eps.com.bd` |
| **GitHub (Plugins & Sample Code)** | `https://github.com/EPS-PG` |

### Postman Collection Credentials (from JSON file — may differ from DOCX)

> **Note:** The Postman collection JSON contained different sandbox credentials. The DOCX credentials above are the authoritative ones provided by EPS.

| Field | Postman Collection Value |
|---|---|
| User Name | `xyz.eps@gmail.com` |
| Password | `Emon258@` |
| Store ID | `35b518f6-aab7-4af1-b16c-335052e9a55c` |

---

## 2. Hash Mechanism (x-hash)

Every API call requires an `x-hash` header. This is an HMAC-SHA512 signature.

### Steps to Generate x-hash

1. **Step 1:** Encode the **Hash Key** using UTF-8
2. **Step 2:** Create an HMAC-SHA512 instance using the encoded Hash Key
3. **Step 3:** Compute the hash using the HMAC and the **signing value** (see per-API table below)
4. **Step 4:** Return the result as a **Base64 string**

### What to Sign (per API)

| API | Value to Hash |
|---|---|
| GetToken | `userName` (the email address) |
| InitializeEPS | `merchantTransactionId` |
| CheckMerchantTransactionStatus | `merchantTransactionId` OR `EPSTransactionId` (Live V5 only) |

### Example Hash Key (from documentation)

The docs reference this example hash key:
```
SFNLQHJlY2lwZXdhbGEjYTc3Zi1mOTQ5NWZhY2M2ZTZuZXQ=
```

### Pseudocode

```python
import hmac
import hashlib
import base64

def generate_x_hash(hash_key: str, data: str) -> str:
    key_bytes = hash_key.encode('utf-8')
    data_bytes = data.encode('utf-8')
    hmac_obj = hmac.new(key_bytes, data_bytes, hashlib.sha512)
    return base64.b64encode(hmac_obj.digest()).decode('utf-8')

# For GetToken:
x_hash = generate_x_hash("FHZxyzeps56789gfhg678ygu876o=", "Epsdemo@gmail.com")

# For InitializeEPS:
x_hash = generate_x_hash("FHZxyzeps56789gfhg678ygu876o=", "20240956354678")

# For CheckStatus:
x_hash = generate_x_hash("FHZxyzeps56789gfhg678ygu876o=", "20240956354678")
```

---

## 3. Transaction Type IDs

| TransactionTypeId | Type |
|---|---|
| 1 | Web |
| 2 | Android Devices |
| 3 | iOS Devices |
| 10 | *(Used in Postman examples — may be a general/default type)* |

---

## 4. API No.01 — GetToken

Authenticates the merchant and returns a JWT bearer token.

### Request

| Property | Value |
|---|---|
| **Method** | `POST` |
| **Sandbox URL** | `https://sandboxpgapi.eps.com.bd/v1/Auth/GetToken` |
| **Live URL** | `https://pgapi.eps.com.bd/v1/Auth/GetToken` |

### Headers

| Key | Value |
|---|---|
| `x-hash` | HMAC-SHA512 of `userName` using your Hash Key (Base64) |

### Request Parameters

| # | Parameter | Required | Type |
|---|---|---|---|
| 1 | `userName` | **M** | String |
| 2 | `password` | **M** | String |

### Hash Creation

| Parameter for Hash | Value |
|---|---|
| Signing Value | `userName` (the email) |

### Request Body (Sandbox Example)

```json
{
  "userName": "Epsdemo@gmail.com",
  "password": "Epsdemo258@"
}
```

### Request Body (Live Example)

```json
{
  "userName": "shafiulalam.sra@gmail.com",
  "password": "Trialvo8@"
}
```

### Response (Success)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....<long JWT>",
  "expireDate": "2024-03-31T16:27:23.3751441",
  "errorMessage": null,
  "errorCode": null
}
```

### Response Fields

| Field | Type | Description |
|---|---|---|
| `token` | String | JWT bearer token to use in subsequent API calls |
| `expireDate` | DateTime | When the token expires |
| `errorMessage` | String / null | Error description if auth failed |
| `errorCode` | String / null | Error code if auth failed |

---

## 5. API No.02 — Initialize Payment

Creates a new payment transaction and returns a redirect URL for the customer.

### Request

| Property | Value |
|---|---|
| **Method** | `POST` |
| **Sandbox URL** | `https://sandboxpgapi.eps.com.bd/v1/EPSEngine/InitializeEPS` |
| **Live URL** | `https://pgapi.eps.com.bd/v1/EPSEngine/InitializeEPS` |

### Headers

| Key | Value |
|---|---|
| `x-hash` | HMAC-SHA512 of `merchantTransactionId` using your Hash Key (Base64) |
| `Authorization` | `Bearer <token from GetToken API>` |

### Hash Creation

| Parameter for Hash | Value |
|---|---|
| Signing Value | `merchantTransactionId` |

### Request Parameters (Full Table)

| # | Parameter | Required | Type | Description / Remarks |
|---|---|---|---|---|
| 1 | `merchantId` | **M** | String | Your Merchant ID (e.g., `094980ee-XXX-XXX-XXX`) |
| 2 | `storeId` | **M** | String | Your Store ID (e.g., `35b518f6-XXXX-XXXX`) |
| 3 | `CustomerOrderId` | **M** | String | Must be unique every time (e.g., `Order123`) |
| 4 | `merchantTransactionId` | **M** | String | Unique ID, minimum 10 digits. Unique for every single transaction. |
| 5 | `transactionTypeId` | **M** | int | 1=Web, 2=Android, 3=iOS |
| 6 | `totalAmount` | **M** | Decimal | Total payment amount |
| 7 | `successUrl` | **M** | String | URL to redirect on successful payment |
| 8 | `failUrl` | **M** | String | URL to redirect on failed payment |
| 9 | `cancelUrl` | **M** | String | URL to redirect on cancelled payment |
| 10 | `customerName` | **M** | String | Customer's full name |
| 11 | `customerEmail` | **M** | String | Customer's email address |
| 12 | `customerAddress` | **M** | String | Customer's primary address |
| 13 | `customerAddress2` | O | String | Customer's secondary address |
| 14 | `customerCity` | **M** | String | Customer's city |
| 15 | `customerState` | **M** | String | Customer's state/division |
| 16 | `customerPostcode` | **M** | String | Customer's postal code |
| 17 | `customerCountry` | **M** | String | Customer's country code (e.g., `BD`) |
| 18 | `customerPhone` | **M** | String | Customer's phone number |
| 19 | `shipmentName` | O | String | Shipment recipient name |
| 20 | `shipmentAddress` | O | String | Shipment address line 1 |
| 21 | `shipmentAddress2` | O | String | Shipment address line 2 |
| 22 | `shipmentCity` | O | String | Shipment city |
| 23 | `shipmentState` | O | String | Shipment state |
| 24 | `shipmentPostcode` | O | String | Shipment postal code |
| 25 | `shipmentCountry` | O | String | Shipment country code |
| 26 | `valueA` | O | String | Custom value A (merchant use) |
| 27 | `valueB` | O | String | Custom value B (merchant use) |
| 28 | `valueC` | O | String | Custom value C (merchant use) |
| 29 | `valueD` | O | String | Custom value D (merchant use) |
| 30 | `shippingMethod` | O | String | Shipping method description |
| 31 | `noOfItem` | O | String | Number of items |
| 32 | `productName` | **M** | String | Product name |
| 33 | `productProfile` | O | String | Product profile/image URL |
| 34 | `productCategory` | O | String | Product category |
| — | `financialEntityId` | — | int | Default: `0` |
| — | `transitionStatusId` | — | int | Default: `0` |
| — | `ipAddress` | — | String | Client IP address |
| — | `version` | — | String | API version (e.g., `"1"`) |
| — | `ProductList` | O | Array | Array of product objects (see below) |

### ProductList Item Structure

| Field | Type | Description |
|---|---|---|
| `ProductName` | String | Name of the product |
| `NoOfItem` | String | Quantity |
| `ProductProfile` | String | Product profile or image URL |
| `ProductCategory` | String | Product category |
| `ProductPrice` | String | Price of the product |

### Additional Instructions

1. `merchantTransactionId` **must be unique** for every transaction.
2. API consumers **must provide** `successUrl`, `failUrl`, `cancelUrl` to receive return data in the query string of the redirect URL, and process further using that data.

### Request Body (Full Example)

```json
{
  "storeId": "d44e705f-9e3a-41de-98b1-1674631637da",
  "CustomerOrderId": "Order12345",
  "merchantTransactionId": "20240624120615835",
  "transactionTypeId": 1,
  "financialEntityId": 0,
  "transitionStatusId": 0,
  "totalAmount": 1,
  "ipAddress": "103.12.45.69",
  "version": "1",
  "successUrl": "https://yoursite.com/payment/success",
  "failUrl": "https://yoursite.com/payment/fail",
  "cancelUrl": "https://yoursite.com/payment/cancel",
  "customerName": "Shariful Islam",
  "customerEmail": "example@gmail.com",
  "customerAddress": "Uttara, Dhaka-1230",
  "customerAddress2": "Uttara, Khulna-123011",
  "customerCity": "Khulna",
  "customerState": "Khulna",
  "customerPostcode": "12301",
  "customerCountry": "BD",
  "customerPhone": "01912610899",
  "shipmentName": "ABC",
  "shipmentAddress": "Address",
  "shipmentAddress2": "Address",
  "shipmentCity": "CityNam",
  "shipmentState": "StateNam",
  "shipmentPostcode": "1230",
  "shipmentCountry": "BD",
  "valueA": "",
  "valueB": "",
  "valueC": "",
  "valueD": "",
  "shippingMethod": "NO",
  "noOfItem": "1",
  "productName": "candy",
  "productProfile": "general",
  "productCategory": "Demo",
  "ProductList": [
    {
      "ProductName": "Product name 1",
      "NoOfItem": "2",
      "ProductProfile": "ProductProfile 1",
      "ProductCategory": "Product Image URL",
      "ProductPrice": "105"
    },
    {
      "ProductName": "Product name 2",
      "NoOfItem": "7",
      "ProductProfile": "Product Image URL",
      "ProductCategory": "ProductCategory 2",
      "ProductPrice": "210"
    }
  ]
}
```

### Response (Success)

```json
{
  "TransactionId": "23e02880-f378-4594-86f8-30ecb5998094",
  "RedirectURL": "https://pg.eps.com.bd/PG?data=23e02880-f378-4594-86f8-30ecb5998094",
  "ErrorMessage": "",
  "ErrorCode": null,
  "FinancialEntityList": null
}
```

### Response Fields

| Field | Type | Description |
|---|---|---|
| `TransactionId` | String (UUID) | EPS-assigned transaction ID |
| `RedirectURL` | String (URL) | Redirect the customer to this URL to complete payment |
| `ErrorMessage` | String | Error description (empty on success) |
| `ErrorCode` | String / null | Error code (null on success) |
| `FinancialEntityList` | Array / null | List of available payment methods (null if not applicable) |

### After Response — What to Do

1. Take the `RedirectURL` from the response
2. **Redirect the customer** to that URL (browser redirect)
3. Customer completes payment on EPS payment page
4. EPS redirects the customer back to your `successUrl`, `failUrl`, or `cancelUrl`
5. **Transaction data is returned** in the query string of the redirect URL
6. Process the returned data and verify via API No.03

---

## 6. API No.03 — Verify Transaction (Check Status)

Verifies the status of a completed transaction server-side.

### Request

| Property | Value |
|---|---|
| **Method** | `GET` |
| **Sandbox URL** | `https://sandboxpgapi.eps.com.bd/v1/EPSEngine/CheckMerchantTransactionStatus` |
| **Live URL** | `https://pgapi.eps.com.bd/v1/EPSEngine/CheckMerchantTransactionStatus` |

### Headers

| Key | Value |
|---|---|
| `x-hash` | HMAC-SHA512 of `merchantTransactionId` (or `EPSTransactionId` in Live V5) using your Hash Key |
| `Authorization` | `Bearer <token from GetToken API>` |

### Query Parameters

#### Sandbox (V4) — Single lookup key

```
?merchantTransactionId=20240624120615835
```

#### Live (V5) — Supports both lookup keys

```
?merchantTransactionId=202406241206158&EPSTransactionId=C254919040105F
```

### Hash Creation (V4 — Sandbox)

| Parameter for Hash | Value |
|---|---|
| Signing Value | `merchantTransactionId` |

### Hash Creation (V5 — Live) — Two Options

| Option | Parameter for Hash | Value |
|---|---|---|
| Option A | Signing Value | `merchantTransactionId` |
| Option B | Signing Value | `EPSTransactionId` |

> **Note (V5 only):** When using `merchantTransactionId` to get details, use `merchantTransactionId` for the hash. OR use `EPSTransactionId` for the hash instead. Use one or the other — not both.

### Response (Success — Sandbox V4)

```json
{
  "MerchantTransactionId": "20240624120615835",
  "Status": "Success",
  "TotalAmount": "1.00",
  "TransactionDate": "24 Jun 2024 06:06:19 PM",
  "TransactionType": "Purchase",
  "FinancialEntity": "OKWallet",
  "ErrorCode": "",
  "ErrorMessage": "",
  "CustomerId": "3245",
  "CustomerName": "Shariful Islam",
  "CustomerEmail": "example@gmail.com",
  "CustomerAddress": "Uttara, Dhaka-1230",
  "CustomerAddress2": "Uttara, Khulna-123011",
  "CustomerCity": "Khulna",
  "CustomerState": "Khulna",
  "CustomerPostcode": "12301",
  "CustomerCountry": "BD",
  "CustomerPhone": "01912610899",
  "ShipmentName": "ABC",
  "ShipmentAddress": "Address",
  "ShipmentAddress2": "Address",
  "ShipmentCity": "CityNam",
  "ShipmentState": "StateNam",
  "ShipmentPostcode": "1230",
  "ShipmentCountry": "BD",
  "ValueA": "",
  "ValueB": "",
  "ValueC": "",
  "ValueD": "",
  "ShippingMethod": "NO",
  "NoOfItem": "1",
  "ProductName": "candy",
  "ProductProfile": "general",
  "ProductCategory": "Demo"
}
```

### Response (Success — Live V5) — Additional Fields

```json
{
  "MerchantTransactionId": "20240624120615835",
  "EpsTransactionId": "C2549190401",
  "Status": "Success",
  "TotalAmount": "1.00",
  "TransactionDate": "24 Jun 2024 06:06:19 PM",
  "TransactionType": "Purchase",
  "FinancialEntity": "OKWallet",
  "ErrorCode": "",
  "ErrorMessage": "",
  "CustomerId": "3245",
  "CustomerName": "Shariful Islam",
  "CustomerEmail": "example@gmail.com",
  "CustomerAddress": "Uttara, Dhaka-1230",
  "CustomerAddress2": "Uttara, Khulna-123011",
  "CustomerCity": "Khulna",
  "CustomerState": "Khulna",
  "CustomerPostcode": "12301",
  "CustomerCountry": "BD",
  "CustomerPhone": "01912610899",
  "ShipmentName": "ABC",
  "ShipmentAddress": "Address",
  "ShipmentAddress2": "Address",
  "ShipmentCity": "CityNam",
  "ShipmentState": "StateNam",
  "ShipmentPostcode": "1230",
  "ShipmentCountry": "BD",
  "ValueA": "",
  "ValueB": "",
  "ValueC": "",
  "ValueD": "",
  "ShippingMethod": "NO",
  "NoOfItem": "1",
  "ProductName": "candy",
  "ProductProfile": "general",
  "ProductCategory": "Demo",
  "PaymentReferance": "EducationFee"
}
```

### Response Fields

| Field | Type | Description | V4 | V5 |
|---|---|---|---|---|
| `MerchantTransactionId` | String | Your original transaction ID | ✅ | ✅ |
| `EpsTransactionId` | String | EPS-assigned transaction reference | ❌ | ✅ |
| `Status` | String | Transaction status (`Success`, `Failed`, etc.) | ✅ | ✅ |
| `TotalAmount` | String | Amount charged | ✅ | ✅ |
| `TransactionDate` | String | Date/time of transaction | ✅ | ✅ |
| `TransactionType` | String | Type (e.g., `Purchase`) | ✅ | ✅ |
| `FinancialEntity` | String | Payment method used (e.g., `OKWallet`) | ✅ | ✅ |
| `ErrorCode` | String | Error code (empty on success) | ✅ | ✅ |
| `ErrorMessage` | String | Error message (empty on success) | ✅ | ✅ |
| `CustomerId` | String | EPS customer ID | ✅ | ✅ |
| `CustomerName` | String | Customer's name | ✅ | ✅ |
| `CustomerEmail` | String | Customer's email | ✅ | ✅ |
| `CustomerAddress` | String | Customer's address | ✅ | ✅ |
| `CustomerAddress2` | String | Secondary address | ✅ | ✅ |
| `CustomerCity` | String | City | ✅ | ✅ |
| `CustomerState` | String | State/Division | ✅ | ✅ |
| `CustomerPostcode` | String | Postal code | ✅ | ✅ |
| `CustomerCountry` | String | Country code | ✅ | ✅ |
| `CustomerPhone` | String | Phone number | ✅ | ✅ |
| `ShipmentName` | String | Shipping recipient | ✅ | ✅ |
| `ShipmentAddress` | String | Shipping address | ✅ | ✅ |
| `ShipmentAddress2` | String | Shipping address 2 | ✅ | ✅ |
| `ShipmentCity` | String | Shipping city | ✅ | ✅ |
| `ShipmentState` | String | Shipping state | ✅ | ✅ |
| `ShipmentPostcode` | String | Shipping postal code | ✅ | ✅ |
| `ShipmentCountry` | String | Shipping country | ✅ | ✅ |
| `ValueA` — `ValueD` | String | Custom merchant values | ✅ | ✅ |
| `ShippingMethod` | String | Shipping method | ✅ | ✅ |
| `NoOfItem` | String | Number of items | ✅ | ✅ |
| `ProductName` | String | Product name | ✅ | ✅ |
| `ProductProfile` | String | Product profile | ✅ | ✅ |
| `ProductCategory` | String | Product category | ✅ | ✅ |
| `PaymentReferance` | String | Payment reference (e.g., `EducationFee`) | ❌ | ✅ |

---

## 7. Integration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    EPS Payment Integration Flow                  │
└─────────────────────────────────────────────────────────────────┘

Step 1: AUTHENTICATE
┌──────────────┐        POST /Auth/GetToken         ┌───────────┐
│  Your Server │ ──────────────────────────────────> │  EPS API  │
│              │ <────────────────────────────────── │           │
│              │        { token, expireDate }        │           │
└──────────────┘                                    └───────────┘
  Headers: x-hash = HMAC-SHA512(userName, HashKey)

Step 2: INITIALIZE PAYMENT
┌──────────────┐    POST /EPSEngine/InitializeEPS   ┌───────────┐
│  Your Server │ ──────────────────────────────────> │  EPS API  │
│              │ <────────────────────────────────── │           │
│              │   { TransactionId, RedirectURL }    │           │
└──────────────┘                                    └───────────┘
  Headers: Authorization: Bearer <token>
           x-hash = HMAC-SHA512(merchantTransactionId, HashKey)

Step 3: REDIRECT CUSTOMER
┌──────────────┐          302 Redirect              ┌───────────┐
│  Your Server │ ──────────────────────────────────> │  Customer │
│              │         (to RedirectURL)            │  Browser  │
└──────────────┘                                    └───────────┘
                                                         │
                          Customer pays on EPS page      │
                                                         ▼
                                                    ┌───────────┐
                                                    │  EPS PG   │
                                                    │  Page     │
                                                    └───────────┘
                                                         │
                          EPS redirects back to          │
                          successUrl / failUrl /         │
                          cancelUrl with query data      │
                                                         ▼
                                                    ┌───────────┐
                                                    │  Customer │
                                                    │  Browser  │
                                                    └───────────┘

Step 4: VERIFY TRANSACTION (Server-Side)
┌──────────────┐  GET /EPSEngine/CheckMerchant...   ┌───────────┐
│  Your Server │ ──────────────────────────────────> │  EPS API  │
│              │ <────────────────────────────────── │           │
│              │    { Status, TotalAmount, ... }     │           │
└──────────────┘                                    └───────────┘
  Headers: Authorization: Bearer <token>
           x-hash = HMAC-SHA512(merchantTransactionId, HashKey)
```

---

## 8. Sandbox vs Live — Key Differences

| Feature | Sandbox (V4) | Live (V5) |
|---|---|---|
| **Base URL** | `https://sandboxpgapi.eps.com.bd/v1` | `https://pgapi.eps.com.bd/v1` |
| **Merchant ID** | `29e86e70-0ac6-45eb-ba04-9fcb0aaed12a` | `0f71ad2d-2cfe-4b32-8804-918db808cd6f` |
| **Store ID** | `d44e705f-9e3a-41de-98b1-1674631637da` | `b3a6ac12-f3be-4d5f-b0d0-c59e322436d5` |
| **User Name** | `Epsdemo@gmail.com` | `shafiulalam.sra@gmail.com` |
| **Password** | `Epsdemo258@` | `Trialvo8@` |
| **Hash Key** | `FHZxyzeps56789gfhg678ygu876o=` | `FMUNISHOY2lWZEPSXTy38CF3TRIALVO` |
| **`EpsTransactionId` in response** | ❌ Not included | ✅ Included |
| **`PaymentReferance` in response** | ❌ Not included | ✅ Included |
| **Verify by `EPSTransactionId`** | ❌ Not supported | ✅ Supported (alternative to merchantTransactionId) |
| **Merchant Dashboard** | N/A | `https://merchant.eps.com.bd` |

---

## 9. Merchant Dashboard & Resources

| Resource | URL |
|---|---|
| **Merchant Dashboard (Live)** | [https://merchant.eps.com.bd](https://merchant.eps.com.bd) |
| **EPS Website** | [https://www.eps.com.bd](https://www.eps.com.bd) |
| **GitHub — Plugins & Sample Code** | [https://github.com/EPS-PG](https://github.com/EPS-PG) |
| **Contact Email** | info@eps.com.bd |

---

## 10. Footer / Branding Assets

The following branding assets are provided for merchant websites:

| File | Description |
|---|---|
| `Checkout-Page-Pay_with_EPS.png` | "Pay with EPS" button for checkout page |
| `Footer-Desktop-Dark-Version.png` | Desktop footer badge (dark theme) |
| `Footer-Desktop-Light-Version.png` | Desktop footer badge (light theme) |
| `Footer-Mobile-Dark-Version.png` | Mobile footer badge (dark theme) |
| `Footer-Mobile-Light-Version.png` | Mobile footer badge (light theme) |

**Location:** `Trialvo 12/Trialvo/Trialvo/EPS-PGW_Footer_Merchant_Website/`

---

## Appendix: Complete API Endpoint Summary

| # | Name | Method | Sandbox Endpoint | Live Endpoint |
|---|---|---|---|---|
| 1 | GetToken | POST | `https://sandboxpgapi.eps.com.bd/v1/Auth/GetToken` | `https://pgapi.eps.com.bd/v1/Auth/GetToken` |
| 2 | InitializeEPS | POST | `https://sandboxpgapi.eps.com.bd/v1/EPSEngine/InitializeEPS` | `https://pgapi.eps.com.bd/v1/EPSEngine/InitializeEPS` |
| 3 | CheckStatus | GET | `https://sandboxpgapi.eps.com.bd/v1/EPSEngine/CheckMerchantTransactionStatus` | `https://pgapi.eps.com.bd/v1/EPSEngine/CheckMerchantTransactionStatus` |

---

*Document generated from original EPS-provided files. All credentials and API details verified against source PDFs and encrypted DOCX files.*
