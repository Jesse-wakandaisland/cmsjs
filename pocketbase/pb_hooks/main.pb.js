/**
 * PocketBase Hooks for CMS.js
 * PocketBase 0.20.x JavaScript Hooks
 */

// CORS middleware for all routes
routerAdd("GET", "/*", (c) => {
  c.response().header().set("Access-Control-Allow-Origin", "*")
  c.response().header().set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
  c.response().header().set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return c.next()
}, $apis.requireAdminOrRecordAuth())

routerAdd("POST", "/*", (c) => {
  c.response().header().set("Access-Control-Allow-Origin", "*")
  c.response().header().set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
  c.response().header().set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return c.next()
})

routerAdd("OPTIONS", "/*", (c) => {
  c.response().header().set("Access-Control-Allow-Origin", "*")
  c.response().header().set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
  c.response().header().set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return c.noContent(204)
})

// Log record operations for AevIP sync
onRecordAfterCreateRequest((e) => {
  console.log(`[AevIP] Record created: ${e.collection.name}/${e.record.id}`)
}, "content", "templates", "variations", "aframe_objects")

onRecordAfterUpdateRequest((e) => {
  console.log(`[AevIP] Record updated: ${e.collection.name}/${e.record.id}`)
}, "content", "templates", "variations", "aframe_objects")

onRecordAfterDeleteRequest((e) => {
  console.log(`[AevIP] Record deleted: ${e.collection.name}/${e.record.id}`)
}, "content", "templates", "variations", "aframe_objects")
