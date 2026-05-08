# Support Escalation Playbook

Escalation starts when opsStatus is support-needed, delivery-failed, webhook-failed, or reissue-needed. Required information: orderId, productSlug, masked buyer contact, masked payment key when relevant, grant status, incident type, and requested resolution. Forbidden exports: raw payment key, raw buyer email, raw webhook payload, r2Key, privatePath, publicUrl, downloadUrl, Cloudflare secret, Access JWT.
