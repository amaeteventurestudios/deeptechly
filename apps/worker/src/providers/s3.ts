import {
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { CapabilityHealth, ObjectStore } from "@deeptechly/kernel";
import type { S3Config } from "./config";

type S3Like = Pick<S3Client, "send">;

export class S3ObjectStoreAdapter implements ObjectStore {
  private readonly client: S3Like;

  constructor(private readonly config: S3Config, client?: S3Like) {
    this.client = client ?? new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey }
    });
  }

  async health(): Promise<CapabilityHealth> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.config.bucket }));
      return { provider: "s3", status: "available", checkedAt: new Date().toISOString() };
    } catch {
      return { provider: "s3", status: "unavailable", checkedAt: new Date().toISOString() };
    }
  }

  async put(key: string, body: Uint8Array, contentType: string) {
    await this.client.send(new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: safeKey(key),
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: "AES256"
    }));
  }

  async get(key: string) {
    const response = await this.client.send(new GetObjectCommand({ Bucket: this.config.bucket, Key: safeKey(key) }));
    return response.Body ? new Uint8Array(await response.Body.transformToByteArray()) : null;
  }

  async signedReadUrl(key: string, expiresInSeconds: number) {
    if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 1 || expiresInSeconds > 3600) {
      throw new Error("Signed URL expiry must be between 1 and 3600 seconds");
    }
    return getSignedUrl(
      this.client as S3Client,
      new GetObjectCommand({ Bucket: this.config.bucket, Key: safeKey(key) }),
      { expiresIn: expiresInSeconds }
    );
  }
}

function safeKey(value: string) {
  if (!value || value.length > 1024 || value.startsWith("/") || value.includes("\\") || value.split("/").includes("..")) {
    throw new Error("Object key is invalid");
  }
  return value;
}
