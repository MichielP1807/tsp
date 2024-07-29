import { Elysia } from 'elysia';
import { generate as generateEd25519 } from '@digitalbazaar/ed25519-multikey';
import { createSigner, createDID } from 'trustdidweb-ts';

const app = new Elysia()
  .get('/', () => 'Hello world!')
  .get('/create', async () => {
    // const ed25519 = await generateEd25519();
    
    const keys = {
      x25519: {
        publicKeyMultibase: "z6LSdYjdAE7ZY1Gh5VPAxDJdgbg45Lq6im3N9o6HqnYZ6fWH",
        secretKeyMultibase: "z3wenxJRZ3fG6m3i1cMbeekeQWLv4uUV6biCBj73qTL3LZQh"
      },
      ed25519: {
        publicKeyMultibase: 'z6Mkw1KSvGWNAwSwWbcpwPgFARX4vKPa1xvcDMsJ5b48Zj6B',
        secretKeyMultibase:
          'zruzhcN866F8BpUX6LDPPAUWdHRi3Jjg5q8yxGGX5KoKfaDe8Pexn45mHsHvqX714Bqt3t3AYKXVat9BPduGwq3NZgf',
      },
    };

    const authKey = {
      type: 'authentication' as const,
      ...keys.ed25519,
    };

    const agreementKey = {
      type: 'keyAgreement' as const,
      ...keys.x25519,
    };

    const signer = createSigner(authKey);

    const result = await createDID({
      domain: 'example.com',
      signer,
      updateKeys: [
        `did:key:${authKey.publicKeyMultibase}`,
        `did:key:${agreementKey.publicKeyMultibase}`,
      ],
      verificationMethods: [authKey, agreementKey],
      created: new Date(),
    });

    return result;
  })
  .listen(8000);

console.log(
  `🔍 Publication server is running at on port ${app.server?.port}...`
);
