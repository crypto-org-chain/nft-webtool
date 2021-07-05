export const NFT_IMAGE_DENOM_SCHEMA = {
    title: 'Asset Metadata',
    type: 'Object',
    properties: {
        description: {
            type: 'string',
            description: 'Describes the asset to which this NFT represents',
        },
        name: {
            type: 'string',
            description: 'Identifies the asset to which this NFT represents',
        },
        image: {
            type: 'string',
            description: 'A URI pointing to a resource with mime type image',
        },
        mimeType: {
            type: 'string',
            description: 'Describes the type of represented NFT media',
        },
    },
};
export const NFT_VIDEO_DENOM_SCHEMA = {
    title: 'Asset Metadata',
    type: 'Object',
    properties: {
        description: {
            type: 'string',
            description: 'Describes the asset to which this NFT represents',
        },
        name: {
            type: 'string',
            description: 'Identifies the asset to which this NFT represents',
        },
        image: {
            type: 'string',
            description: 'A URI pointing to a resource with mime type image',
        },
        animation_url: {
            type: 'string',
            description: 'A URI pointing to a resource with mime type video',
        },
        mimeType: {
            type: 'string',
            description: 'Describes the type of represented NFT media',
        },
    },
};

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 20 * 1024 * 1024;