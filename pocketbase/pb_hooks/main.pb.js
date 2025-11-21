/**
 * PocketBase Hooks
 * This file runs server-side in PocketBase
 */

// CORS configuration for development
onBeforeServe((e) => {
  e.router.pre((c) => {
    c.response.header().set('Access-Control-Allow-Origin', '*')
    c.response.header().set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    c.response.header().set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (c.request.method === 'OPTIONS') {
      return c.noContent(204)
    }

    return c.next()
  })
})

// Log all record changes for AevIP sync
onRecordAfterCreateRequest((e) => {
  console.log(`[AevIP] Record created: ${e.collection.name}/${e.record.id}`)
})

onRecordAfterUpdateRequest((e) => {
  console.log(`[AevIP] Record updated: ${e.collection.name}/${e.record.id}`)
})

onRecordAfterDeleteRequest((e) => {
  console.log(`[AevIP] Record deleted: ${e.collection.name}/${e.record.id}`)
})
