type PresignedUrlType = "MEMBER_PROFILE";

interface GetPresignedUrlRequest {
    type: PresignedUrlType;
    fileName: string;
}

export type { GetPresignedUrlRequest, PresignedUrlType };
