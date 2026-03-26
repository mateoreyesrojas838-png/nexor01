import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'NEXOR',
        short_name: 'JD INTER',
        description: 'Plataforma Oficial - NEXOR',
        start_url: '/',
        display: 'standalone',
        background_color: '#0A0A0A',
        theme_color: '#FFD700',
        icons: [
            {
                src: '/logo.png',
                sizes: 'any',
                type: 'image/png',
            },
        ],
    }
}
