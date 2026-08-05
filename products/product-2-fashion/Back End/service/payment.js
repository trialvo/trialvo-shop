const axios = require("axios");
const errors = require('../helpers/errors');
const crypto = require('crypto');
const {GUEST_SSL_EMAIL}=require('../config/ApplicationSettings');
/**
 * SSLCommerz handler
 */
exports.handleSSLCommerz=  async  (order, creds,payment) =>{
  const formData = new URLSearchParams();
  formData.append('store_id', creds.SSL_STORE_ID);
  formData.append('store_passwd', creds.SSL_STORE_PASS);
  formData.append('total_amount', payment.amount); //payment.id
  formData.append('currency', 'BDT');
  formData.append('tran_id', payment.id);

  formData.append('ipn_url', creds.SSL_IPN_URL);
  formData.append('success_url', creds.SSL_SUCCESS_URL);
  formData.append('fail_url', creds.SSL_FAIL_URL);
  formData.append('cancel_url', creds.SSL_CANCEL_URL);
  
  // Customer info (required by SSL)
  formData.append('cus_name', order.customer_name);
  formData.append('cus_email', order.customer_email || GUEST_SSL_EMAIL);
  formData.append('cus_phone', order.customer_phone);


  // Use address data from the DB or fallback to placeholders for testing
  formData.append('cus_add1', order?.full_address);
  formData.append('cus_city', order?.city || '');
  formData.append('cus_postcode', order?.post_code || '');
  formData.append('cus_country', 'Bangladesh');

// Shipment Info (Required if shipping physical goods)
  formData.append('shipping_method', 'NO');
  // formData.append('num_of_item', 1);
  formData.append('product_name', `Order #${order.id}`);
  formData.append('product_category', 'Retail');
  formData.append('product_profile', 'general');


  const response = await axios.post(`${creds.SSL_BASE_URL}/gwprocess/v4/api.php`, formData);
   
 
  if (response.data.status === 'SUCCESS') {
    return { url: response.data.GatewayPageURL };
  }

  console.log("============",response.data)
  throw new errors.PAYMENT_INITIALISATION_FAILD("SSLCommerz initialization failed");
}








exports.handleShurjopay = async (order, creds, payment) => {
  try {
    /* 1. Get Authentication Token */
    const authResponse = await axios.post(`${creds.SHURJOPAY_BASE_URL}/api/get_token`, {
      username: creds.SHURJOPAY_USERNAME,
      password: creds.SHURJOPAY_PASSWORD,
    });

    const tokenData = authResponse.data;
    if (!tokenData.token) {
        throw new Error("shurjoPay Authentication failed");
    }

    /* 2. Prepare Payment Data */
    const paymentData = {
      token: tokenData.token,
      store_id: tokenData.store_id,
      prefix: creds.SHURJOPAY_PREFIX,
      currency: "BDT",
      return_url: creds.SHURJOPAY_RETURN_URL,
      cancel_url: creds.SHURJOPAY_CANCEL_URL,
      amount: payment.amount,
      order_id: payment.id, // Using your payment log ID as their order_id
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email || "no-email@test.com",
      customer_address: order.full_address || "Dhaka",
      customer_city: order.city || "Dhaka",
      client_ip: creds.SHURJOPAY_CLIENT_IP // Ideally req.ip from your main function
    };

    /* 3. Create Payment Request */
    const checkoutResponse = await axios.post(
      `${creds.SHURJOPAY_BASE_URL}/api/secret-pay`,
      paymentData,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokenData.token}`
        }
      }
    );

    if (checkoutResponse.data.checkout_url) {
      return { url: checkoutResponse.data.checkout_url };
    } else {
      throw new Error(checkoutResponse.data.message || "Checkout URL not found");
    }
  } catch (err) {
    console.error("shurjoPay Init Error:", err.response?.data || err.message);
    throw new errors.PAYMENT_INITIALISATION_FAILD(err.message);
  }
};

exports.handleBkash = async (order, creds, payment) => {
  try {
    /* 1. Generate Grant Token */
    const tokenResponse = await axios.post(
      `${creds.BKASH_BASE_URL}/tokenized/checkout/token/grant`,
      {
        app_key: creds.BKASH_APP_KEY,
        app_secret: creds.BKASH_APP_SECRET
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: creds.BKASH_USERNAME,
          password: creds.BKASH_PASSWORD
        }
      }
    );

    const idToken = tokenResponse.data.id_token;
    if (!idToken) throw new Error("bKash token generation failed");

    /* 2. Create Payment */
    const createResponse = await axios.post(
      `${creds.BKASH_BASE_URL}/tokenized/checkout/create`,
      {
        mode: "0011", // 0011 for Checkout (URL based)
        payerReference: order.customer_phone,
        callbackURL: creds.BKASH_CALLBACK_URL, // Your backend callback listener
        amount: payment.amount.toString(),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: payment.id.toString() // Use payment ID as invoice for tracking
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: idToken,
          "X-APP-Key": creds.BKASH_APP_KEY
        }
      }
    );

    if (createResponse.data.statusCode === '0000') {
      return { url: createResponse.data.bkashURL };
    } else {
      console.error("bKash Create Error:", createResponse.data.statusMessage);
      throw new errors.PAYMENT_INITIALISATION_FAILD(createResponse.data.statusMessage);
    }
  } catch (err) {
    console.error("bKash Handler Error:", err.response?.data || err.message);
    throw new errors.PAYMENT_INITIALISATION_FAILD(err.message || "bKash initialization failed");
  }
};



exports.handleNagad=async(order, creds)=> {
  const { 
    NAGAD_BASE_URL, 
    NAGAD_MERCHANT_ID, 
    NAGAD_PRIV_KEY, 
    NAGAD_PUB_KEY 
  } = creds;

  const datetime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/[-:]/g, ''); 
  const orderId = `NGD${order.id}${Date.now()}`;

  // --- STEP 1: Initialize Payment ---
  const sensitiveData = {
    merchantId: NAGAD_MERCHANT_ID,
    datetime: datetime,
    orderId: orderId,
    challenge: crypto.randomBytes(16).toString('hex')
  };

  // Encrypt sensitive data with Nagad's Public Key
  const encryptedData = crypto.publicEncrypt(
    { key: NAGAD_PUB_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(JSON.stringify(sensitiveData))
  ).toString('base64');

  // Sign the sensitive data with your Private Key
  const signature = crypto.createSign('SHA256').update(JSON.stringify(sensitiveData)).sign(NAGAD_PRIV_KEY, 'base64');

  const initResponse = await axios.post(`${NAGAD_BASE_URL}/initialize/${NAGAD_MERCHANT_ID}/${orderId}`, {
    dateTime: datetime,
    sensitiveData: encryptedData,
    signature: signature
  });

  if (initResponse.data.status !== 'Success') {
    throw new Error("Nagad Initialization Failed: " + initResponse.data.message);
  }

  // --- STEP 2: Decrypt Challenge and Redirect ---
  const decryptedResponse = JSON.parse(
    crypto.privateDecrypt(
      { key: NAGAD_PRIV_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(initResponse.data.sensitiveData, 'base64')
    ).toString()
  );

  const checkoutData = {
    merchantId: NAGAD_MERCHANT_ID,
    orderId: orderId,
    amount: order.paid_amount.toString(),
    currencyCode: '050', // 050 is the code for BDT
    challenge: decryptedResponse.challenge
  };

  const checkoutSignature = crypto.createSign('SHA256').update(JSON.stringify(checkoutData)).sign(NAGAD_PRIV_KEY, 'base64');

  const finalResponse = await axios.post(`${NAGAD_BASE_URL}/complete/${decryptedResponse.paymentReferenceNo}`, {
    sensitiveData: crypto.publicEncrypt(
      { key: NAGAD_PUB_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(JSON.stringify(checkoutData))
    ).toString('base64'),
    signature: checkoutSignature,
    merchantCallbackURL: `https://yourdomain.com/payment/nagad/callback`
  });

  if (finalResponse.data.status === 'Success') {
    return { url: finalResponse.data.callBackUrl };
  }
  
  throw new Error("Nagad Finalization Failed");
}

/**
 * Rocket / COD handler (manual instructions)
 */
exports.handleRocket=async(order, creds, amount)=> {
  return {
    instructions: {
      account_no: creds.ROCKET_ACC_NO,
      account_name: creds.ROCKET_ACC_NAME,
      bank: creds.ROCKET_BANK_NAME,
      note: creds.ROCKET_NOTE,
      suggestion: creds.ROCKET_SUGGESTION,
      amount,
    },
  };
}

 
 