
Ext.namespace("GeoExt.data");

GeoExt.data.ArcGISServiceStore = function(c) {
  c = c || {};
  return GeoExt.data.ArcGISServiceStore.superclass.constructor.call(this, Ext.apply(c, {
    proxy: c.proxy || (!c.data ? new Ext.data.HttpProxy({
      url: c.url,
      disableCaching: false,
      method: "GET"
    }) : undefined),
    reader: new GeoExt.data.ArcGISServiceReader(c, c.fields)
  }));
};

Ext.extend(GeoExt.data.ArcGISServiceStore, Ext.data.Store);
