type PresignedUrlType = "MEMBER_PROFILE";

interface GetPresignedUrlRequest {
    type: PresignedUrlType;
    fileName: string;
}

interface GetPresignedUrlResponse {
    presignUrl: string;
    objectKey: string;
}

interface CustomError {
    code: string;
    message: string;
    fieldErrorsInfos: any;
}

export type {
    CustomError,
    GetPresignedUrlRequest,
    GetPresignedUrlResponse,
    PresignedUrlType,
};
