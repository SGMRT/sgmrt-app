type PresignedUrlType = "MEMBER_PROFILE";

interface GetPresignedUrlRequest {
    type: PresignedUrlType;
    fileName: string;
}

interface GetPresignedUrlResponse {
    presignUrl: string;
    objectKey: string;
}

export type {
    GetPresignedUrlRequest,
    GetPresignedUrlResponse,
    PresignedUrlType,
};
