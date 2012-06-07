Ext.namespace "gxp.plugins"
gxp.plugins.ArcGISSource = Ext.extend(gxp.plugins.LayerSource,
  ptype: "gispro_arcgis"
  restUrl: null
  baseParams: null
  format: null
  describeLayerStore: null
  describedLayers: null
  schemaCache: null
  ready: false
  lazy: false
  url: ''

  createStore: ->
    baseParams = @baseParams or
      f: "json"

    baseParams.VERSION = @version  if @version

    @store = new GeoExt.data.ArcGISServiceStore(
      url: @trimUrl(@url, baseParams)
      baseParams: baseParams
      format: @format
      autoLoad: not @lazy
      layerParams:
        exceptions: null

      listeners:
        load: ->
          if not @store.reader.raw or not @store.reader.raw.layers
            @fireEvent "failure", @, "Invalid capabilities document."
          else
            @title = @store.reader.raw.documentInfo.Title unless @title
            unless @ready
              @ready = true
              @fireEvent "ready", @

        exception: (proxy, type, action, options, response, error) ->
          delete @store

          msg = undefined
          details = ""
          if type is "response"
            if typeof error is "string"
              msg = error
            else
              msg = "Invalid response from server."
              status = response.status
              if status >= 200 and status < 300
                if error.arg
                  report = error.arg.exceptionReport
                  details = gxp.util.getOGCExceptionText(report)
                else
                  details = "Status: " + status + " ErrName: " + error.name + " Message: " + error.message + " Description: " + error.description
              else
                details = "Status: " + status
          else
            msg = "Trouble creating layer store from response."
            details = "Unable to handle response."
          @fireEvent "failure", @, msg, details

        scope: @
    )
    if @lazy
      window.setTimeout (->
        @fireEvent "ready", @
      ).createDelegate(@), 0

  trimUrl: (url, params, respectCase) ->
    urlParams = OpenLayers.Util.getParameters(url)
    params = OpenLayers.Util.upperCaseObject(params)
    keys = 0
    for key of urlParams
      ++keys
      if key.toUpperCase() of params
        --keys
        delete urlParams[key]
    url.split("?").shift() + (if keys then "?" + OpenLayers.Util.getParameterString(urlParams) else "")

  createLayerRecord: (config) ->
    record = undefined
    index = @store.findExact("id", config.id)
    if index > -1
      original = @store.getAt(index)

      layer = new OpenLayers.Layer.ArcGIS93Rest(original.get('name'), @url + '/export',
        layers: config.id,
        transparent: if ( config.transparent == null || config.transparent == undefined ) then true else config.transparent
      )

      maxExtent = null
      restrictedExtent = null

      initialExtent = @store.reader.raw.initialExtent
      if initialExtent
        restrictedExtent = new OpenLayers.Bounds.fromArray [initialExtent.xmin,initialExtent.ymin,initialExtent.xmax,initialExtent.ymax]
        restrictedExtent.transform(new OpenLayers.Projection(@target.map.projection),new OpenLayers.Projection("EPSG:4326"))

      fullExtent = @store.reader.raw.fullExtent
      if fullExtent
        maxExtent = new OpenLayers.Bounds.fromArray [fullExtent.xmin,fullExtent.ymin,fullExtent.xmax,fullExtent.ymax]
        maxExtent.transform(new OpenLayers.Projection(@target.map.projection),new OpenLayers.Projection("EPSG:4326"))

      if !this.viewMangerUsed
        layer.addOptions {maxExtent: maxExtent, restrictedExtent: restrictedExtent}, true

      data = Ext.applyIf(
        title: original.get('name')
        group: config.group
        source: config.source
        #properties: "gxp_wmslayerpanel"
        fixed: config.fixed
        selected: (if "selected" of config then config.selected else false)
        layer: layer
        llbbox: maxExtent.toArray()
        rbbox: restrictedExtent.toArray()
      , original.data)
      fields = [
        name: "rbbox" #Array
      ,
        name: "source"
        type: "string"
      ,
        name: "group"
        type: "string"
      ,
        name: "properties"
        type: "string"
      ,
        name: "fixed"
        type: "boolean"
      ,
        name: "selected"
        type: "boolean"
      ]
      original.fields.each (field) ->
        fields.push field

      Record = GeoExt.data.LayerRecord.create(fields)
      record = new Record(data, layer.id)
    record

  getConfigForRecord: (record) ->
    config = gxp.plugins.ArcGISSource.superclass.getConfigForRecord.apply(@, arguments)
    layer = record.getLayer()
    params = layer.params
    Ext.apply config,
      transparent: params.TRANSPARENT
      id: layer.params.LAYERS

  getState: ->
    state = Ext.apply {}, this.initialConfig
    Ext.apply state,
      title: @title
      ptype: @ptype
)
Ext.preg gxp.plugins.ArcGISSource::ptype, gxp.plugins.ArcGISSource
#var s = new gxp.plugins.ArcGISSource({url: "http://maps.rosreestr.ru/ArcGIS/rest/services/Cadastre/Cadastre/MapServer",title: "Редактируемые"})
#app.layerSources.arcgis = s
#s.on({ready: function(){
  #app.mapPanel.layers.add([ 
    #app.layerSources.arcgis.createLayerRecord({ id: 1, source: 'arcgis'})
  #]
#)
#console.log(app.mapPanel.map.layers[app.mapPanel.map.layers.length - 1])
#}})
#s.init(app)
