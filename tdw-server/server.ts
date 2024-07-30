import { Elysia } from 'elysia';
import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import { X25519KeyAgreementKey2020 } from '@digitalbazaar/x25519-key-agreement-key-2020';
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
import { createSigner, createDID, DIDLog, resolveDID } from 'trustdidweb-ts';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';

const DOMAIN = process.env.DOMAIN;
const db = new PrismaClient();

const app = new Elysia()
  .get('/', () => 'Hello world!')
  .get('/create', async () => {
    const authKey2 = {
      type: 'authentication' as const,
      publicKeyMultibase: "z6Mkw1KSvGWNAwSwWbcpwPgFARX4vKPa1xvcDMsJ5b48Zj6B",
      secretKeyMultibase: "zruzhcN866F8BpUX6LDPPAUWdHRi3Jjg5q8yxGGX5KoKfaDe8Pexn45mHsHvqX714Bqt3t3AYKXVat9BPduGwq3NZgf"
  };

    const ed25519 = await Ed25519Multikey.generate();
    const x25519 = await X25519KeyAgreementKey2020.generate();

    const authKey1 = {
      type: 'authentication' as const,
      //publicKeyMultibase: ed25519.publicKeyMultibase,
      //secretKeyMultibase: ed25519.secretKeyMultibase,
      publicKeyMultibase: "z6Mkw1KSvGWNAwSwWbcpwPgFARX4vKPa1xvcDMsJ5b48Zj6B",
      secretKeyMultibase: "zruzhcN866F8BpUX6LDPPAUWdHRi3Jjg5q8yxGGX5KoKfaDe8Pexn45mHsHvqX714Bqt3t3AYKXVat9BPduGwq3NZgf"
      //secretKeyMultibase:    "zruzhcN866F8BpUX6LDPPAUWdHRi3Jjg6q8yxGGX5KoKfaDe8Pexn45mHsHvqX714Bqt3t3AYKXVat9BPduGwq3NZgf"
    };

    const authKey = authKey1;

    console.log(authKey1, authKey2);

    const agreementKey = {
      type: 'keyAgreement' as const,
      publicKeyMultibase: x25519.publicKeyMultibase,
      secretKeyMultibase: x25519.privateKeyMultibase,
    };

    const result = await createDID({
      domain: DOMAIN,
      signer: createSigner(authKey),
      updateKeys: [
        `did:key:${authKey.publicKeyMultibase}`,
        `did:key:${agreementKey.publicKeyMultibase}`
      ],
      verificationMethods: [authKey, agreementKey],
      created: new Date(),
    });

    // await db.User.create({
    //   data: {
    //     did: result.did,
    //     doc: result.doc,
    //     log: result.log,
    //     meta: result.meta,
    //   },
    // });

    // check validity
    await resolveDID(result.log, {versionId: 1});

    return result;
  })
  .get('/:id', async ({ params: { id } }) => {
    console.log(`Resolving ${id}...`);
    try {
      const user = await db.User.findUnique({ where: { did: id } });
      const logEntries: DIDLog = user.log;

      console.log(logEntries);


      const { doc, meta } = await resolveDID(logEntries, {versionId: 1});

      return { doc, meta };
    } catch (e) {
      console.error(e);
      throw new Error(`Failed to resolve DID`);
    }
  })
  .listen(8000);

console.log(
  `🔍 Publication server is running at on port ${app.server?.port}...`
);
