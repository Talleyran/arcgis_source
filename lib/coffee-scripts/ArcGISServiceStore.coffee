Ext.namespace "GeoExt.data"
GeoExt.data.ArcGISServiceStore = (c) ->
  c = c or {}
  GeoExt.data.ArcGISServiceStore.superclass.constructor.call this, Ext.apply(c,
    proxy: c.proxy or (if not c.data then new Ext.data.HttpProxy(
      url: c.url
      disableCaching: false
      method: "GET"
    ) else `undefined`)
    reader: new GeoExt.data.ArcGISServiceReader(c, c.fields)
  )

Ext.extend GeoExt.data.ArcGISServiceStore, Ext.data.Store
