// Nexor Contacts Extractor — inject.js (v2.1.0)
// Runs in MAIN world at document_start on web.whatsapp.com
// Uses the wa-js dual-loader technique (classic webpack + Meta/metro loader)
// to support both old and new WhatsApp Web versions (>= 2.3000.0)

(function () {
    if (window.__nexor_inject_loaded) return
    window.__nexor_inject_loaded = true

    const g = self
    const TAG = '[Nexor]'
    const log = (...args) => console.log(TAG, ...args)

    let webpackRequire = null
    let loaderType = 'unknown'  // 'webpack' | 'meta' | 'unknown'
    let Store = {}
    let isReady = false

    log('inject.js v2.1.0 starting in MAIN world')

    // ─── Path A: Classic webpack (WhatsApp Web < 2.3000.0) ───────────────────
    const chunkName = 'webpackChunkwhatsapp_web_client'
    try {
        const chunk = g[chunkName] = g[chunkName] || []
        chunk.push([
            ['nexor_hook_' + Date.now()],
            {},
            (wr) => {
                if (loaderType !== 'unknown') return
                loaderType = 'webpack'
                webpackRequire = wr
                log('✓ Classic webpack hook succeeded')
                onInjected()
            },
        ])
        log('Classic webpack hook installed, chunks:', chunk.length)
    } catch (err) {
        log('Classic webpack hook error:', err)
    }

    // ─── Path B: Meta loader (WhatsApp Web >= 2.3000.0) ──────────────────────
    const metaTimer = setInterval(() => {
        if (loaderType !== 'unknown') { clearInterval(metaTimer); return }
        if (!g.require || !g.__d) return
        loaderType = 'meta'
        clearInterval(metaTimer)

        try {
            // Build a webpack-compatible shim using Meta's module system
            webpackRequire = function (id) {
                try {
                    g.ErrorGuard && g.ErrorGuard.skipGuardGlobal && g.ErrorGuard.skipGuardGlobal(true)
                    if (g.importNamespace) return g.importNamespace(id)
                    return g.require(id)
                } catch (_error) {
                    return null
                }
            }

            // Fake .m property by lazy-reading __debug.modulesMap
            Object.defineProperty(webpackRequire, 'm', {
                get: () => {
                    try {
                        const modulesMap = g.require('__debug').modulesMap
                        const ids = Object.keys(modulesMap).filter((id) =>
                            /^(?:use)?WA/.test(id) &&
                            !['WAWebEmojiPanelContentEmojiSearchEmpty.react', 'WAWebMoment-es-do'].includes(id)
                        )
                        const result = {}
                        for (const id of ids) result[id] = modulesMap[id]?.factory
                        return result
                    } catch (err) {
                        log('modulesMap access error:', err)
                        return {}
                    }
                },
            })

            log('✓ Meta loader hook succeeded')
            onInjected()
        } catch (err) {
            log('Meta loader error:', err)
            loaderType = 'unknown'
        }
    }, 500)

    // ─── Search helper: iterate modules to find one matching a predicate ─────
    function findModule(predicate) {
        if (!webpackRequire) return null
        const ids = Object.keys(webpackRequire.m || {})
        for (const id of ids) {
            try {
                const mod = webpackRequire(id)
                if (mod && predicate(mod)) return mod
            } catch { }
        }
        return null
    }

    // ─── After hook is captured, find Store modules using wa-js patterns ─────
    async function onInjected() {
        log('Searching for Store modules...')

        // For classic webpack, preload chunks so lazy modules are available
        if (loaderType === 'webpack' && webpackRequire.e) {
            log('Preloading main chunks...')
            try {
                // Get all possible chunk ids (brute force up to 10000)
                const ids = []
                for (let i = 0; i < 10000; i++) {
                    try {
                        const fn = webpackRequire.u ? webpackRequire.u(i) : null
                        if (fn && !String(fn).includes('undefined')) ids.push(i)
                    } catch { }
                }
                log(`Found ${ids.length} chunk ids to preload`)

                // Preload main chunks first
                const mainIds = ids.filter(i => {
                    try {
                        const name = webpackRequire.u(i) || ''
                        return name.includes('main') && !name.includes('locales')
                    } catch { return false }
                })
                for (const id of mainIds) {
                    try { await webpackRequire.e(id) } catch { }
                }
                log(`Preloaded ${mainIds.length} main chunks`)

                // Then preload the rest in background
                for (const id of ids) {
                    try { await webpackRequire.e(id) } catch { }
                }
                log('Chunk preload complete')
            } catch (err) {
                log('Preload error:', err)
            }
        }

        // Search for Store modules using wa-js predicates
        const chatModule = findModule(m => m.ChatCollection || m.ChatCollectionImpl)
        if (chatModule) {
            Store.Chat = chatModule.ChatCollectionImpl || chatModule.ChatCollection
            log('✓ Found Store.Chat')
        }

        const contactModule = findModule(m => m.ContactCollection || m.ContactCollectionImpl)
        if (contactModule) {
            Store.Contact = contactModule.ContactCollectionImpl || contactModule.ContactCollection
            log('✓ Found Store.Contact')
        }

        const labelModule = findModule(m => m.LabelCollection || m.LabelCollectionImpl)
        if (labelModule) {
            Store.Label = labelModule.LabelCollectionImpl || labelModule.LabelCollection
            log('✓ Found Store.Label')
        }

        const groupMetadataModule = findModule(m => m.GroupMetadataCollection || m.GroupMetadataCollectionImpl)
        if (groupMetadataModule) {
            Store.GroupMetadata = groupMetadataModule.GroupMetadataCollectionImpl || groupMetadataModule.GroupMetadataCollection
            log('✓ Found Store.GroupMetadata')
        }

        // Fallback: some versions expose directly without Impl suffix
        if (!Store.Chat) {
            const m = findModule(m => m.Chat && typeof m.Chat.getModelsArray === 'function')
            if (m) { Store.Chat = m.Chat; log('✓ Found Store.Chat (direct)') }
        }
        if (!Store.Contact) {
            const m = findModule(m => m.Contact && typeof m.Contact.getModelsArray === 'function')
            if (m) { Store.Contact = m.Contact; log('✓ Found Store.Contact (direct)') }
        }
        if (!Store.Label) {
            const m = findModule(m => m.Label && typeof m.Label.getModelsArray === 'function')
            if (m) { Store.Label = m.Label; log('✓ Found Store.Label (direct)') }
        }

        if (Store.Chat) {
            isReady = true
            window.__nexor_store = Store
            log('✓ Store READY', Object.keys(Store))
        } else {
            log('❌ Store.Chat not found — will retry in 5s')
            setTimeout(onInjected, 5000)
        }
    }

    // ─── Utilities ───────────────────────────────────────────────────────────
    function phoneFromId(idObj) {
        if (!idObj) return null
        let serialized = ''
        if (typeof idObj === 'string') serialized = idObj
        else if (idObj._serialized) serialized = idObj._serialized
        else if (idObj.user) serialized = `${idObj.user}@${idObj.server || 's.whatsapp.net'}`

        if (!serialized) return null
        if (serialized.endsWith('@s.whatsapp.net')) {
            const match = serialized.match(/^(\d+)/)
            if (match && match[1].length >= 8) return `+${match[1]}`
        }
        return null
    }

    function getContactName(chat) {
        return (
            chat?.contact?.name ||
            chat?.contact?.pushname ||
            chat?.contact?.verifiedName ||
            chat?.contact?.formattedName ||
            chat?.name ||
            chat?.formattedTitle ||
            ''
        )
    }

    // ─── API handlers ────────────────────────────────────────────────────────
    const handlers = {
        ping() {
            return {
                success: true,
                ready: isReady && !!(Store && Store.Chat),
                hasLabels: !!(Store && Store.Label),
                loaderType,
            }
        },

        listGroups() {
            if (!isReady || !Store.Chat) return { success: false, error: 'Store no listo aún' }
            try {
                const chats = Store.Chat.getModelsArray()
                const groups = chats
                    .filter(c => c.isGroup === true || (c.id?._serialized || '').endsWith('@g.us'))
                    .map(g => {
                        const participants = g.groupMetadata?.participants
                        const pArr = participants?._models || participants?.getModelsArray?.() || participants || []
                        let resolved = 0
                        for (const p of pArr) {
                            if (phoneFromId(p.id)) resolved++
                        }
                        return {
                            id: g.id?._serialized || String(g.id),
                            name: g.formattedTitle || g.name || g.contact?.name || 'Sin nombre',
                            totalMembers: pArr.length,
                            resolvedMembers: resolved,
                        }
                    })
                    .sort((a, b) => a.name.localeCompare(b.name))
                return { success: true, groups }
            } catch (err) {
                return { success: false, error: err.message || String(err) }
            }
        },

        listLabels() {
            if (!isReady || !Store.Chat) return { success: false, error: 'Store no listo aún' }
            if (!Store.Label) return { success: false, error: 'Sin etiquetas (requiere WhatsApp Business)' }
            try {
                const chats = Store.Chat.getModelsArray()
                const labels = Store.Label.getModelsArray().map(l => {
                    const id = String(l.id)
                    const labeledChats = chats.filter(c => {
                        const lids = c.labels || c.labelIds || []
                        return Array.isArray(lids) && lids.map(String).includes(id)
                    })
                    let resolved = 0
                    for (const c of labeledChats) {
                        if (phoneFromId(c.id)) resolved++
                    }
                    return {
                        id,
                        name: l.name || 'Sin nombre',
                        color: l.colorHex || l.color || 0,
                        totalContacts: labeledChats.length,
                        resolvedContacts: resolved,
                    }
                })
                return { success: true, labels }
            } catch (err) {
                return { success: false, error: err.message || String(err) }
            }
        },

        getGroupContacts({ groupIds }) {
            if (!isReady || !Store.Chat) return { success: false, error: 'Store no listo aún' }
            try {
                const contacts = []
                const seen = new Set()
                for (const groupId of groupIds || []) {
                    const chat = Store.Chat.get(groupId)
                    if (!chat) continue
                    const groupName = chat.formattedTitle || chat.name || 'Grupo'
                    const participants = chat.groupMetadata?.participants
                    const pArr = participants?._models || participants?.getModelsArray?.() || participants || []
                    for (const p of pArr) {
                        const phone = phoneFromId(p.id)
                        if (!phone) continue
                        const key = `${groupId}:${phone}`
                        if (seen.has(key)) continue
                        seen.add(key)
                        const contact = p.contact || Store.Contact?.get?.(p.id)
                        const name = contact?.pushname || contact?.name || contact?.verifiedName || ''
                        contacts.push({ phone, name, source: `Grupo: ${groupName}` })
                    }
                }
                return { success: true, contacts }
            } catch (err) {
                return { success: false, error: err.message || String(err) }
            }
        },

        getLabelContacts({ labelIds }) {
            if (!isReady || !Store.Chat || !Store.Label) return { success: false, error: 'Store no listo aún' }
            try {
                const contacts = []
                const seen = new Set()
                const allChats = Store.Chat.getModelsArray()
                const allLabels = Store.Label.getModelsArray()
                const labelNameById = new Map(allLabels.map(l => [String(l.id), l.name || 'Etiqueta']))

                for (const labelId of labelIds || []) {
                    const labelName = labelNameById.get(String(labelId)) || 'Etiqueta'
                    for (const chat of allChats) {
                        if (chat.isGroup) continue
                        const lids = chat.labels || chat.labelIds || []
                        if (!Array.isArray(lids) || !lids.map(String).includes(String(labelId))) continue
                        const phone = phoneFromId(chat.id)
                        if (!phone) continue
                        const key = `${labelId}:${phone}`
                        if (seen.has(key)) continue
                        seen.add(key)
                        contacts.push({ phone, name: getContactName(chat), source: `Etiqueta: ${labelName}` })
                    }
                }
                return { success: true, contacts }
            } catch (err) {
                return { success: false, error: err.message || String(err) }
            }
        },

        listAllChats() {
            if (!isReady || !Store.Chat) return { success: false, error: 'Store no listo aún' }
            try {
                const chats = Store.Chat.getModelsArray()
                const contacts = []
                const seen = new Set()
                for (const chat of chats) {
                    if (chat.isGroup) continue
                    const phone = phoneFromId(chat.id)
                    if (!phone || seen.has(phone)) continue
                    seen.add(phone)
                    contacts.push({ phone, name: getContactName(chat), source: 'Chat' })
                }
                return { success: true, contacts }
            } catch (err) {
                return { success: false, error: err.message || String(err) }
            }
        },
    }

    // ─── Message bridge (MAIN ↔ ISOLATED content script) ────────────────────
    window.addEventListener('message', (event) => {
        if (event.source !== window) return
        const data = event.data
        if (!data || data.type !== 'NEXOR_REQUEST') return

        const { id, action, params } = data
        const handler = handlers[action]
        const respond = (result) => {
            window.postMessage({ type: 'NEXOR_RESPONSE', id, result }, '*')
        }

        if (!handler) {
            respond({ success: false, error: `Acción desconocida: ${action}` })
            return
        }

        try {
            const result = handler(params || {})
            if (result && typeof result.then === 'function') {
                result.then(respond).catch(err => respond({ success: false, error: err?.message || String(err) }))
            } else {
                respond(result)
            }
        } catch (err) {
            respond({ success: false, error: err?.message || String(err) })
        }
    })

    log('✓ inject.js v2.1.0 loaded, waiting for WhatsApp...')
})()
