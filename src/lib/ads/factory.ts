import { AdPlatform } from '@prisma/client'
import { IAdsAdapter } from './types'
import { MetaAdapter } from './adapters/meta'

export class AdapterFactory {
    static getAdapter(platform: AdPlatform): IAdsAdapter {
        switch (platform) {
            case AdPlatform.META:
                return new MetaAdapter()
            default:
                throw new Error(`Platform ${platform} not supported`)
        }
    }
}
