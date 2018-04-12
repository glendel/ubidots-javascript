'use strict';

const Request = {
  execute : function( settings ) {
    jQuery.ajax( settings );
  }
};

const RestClient = {
  get : function( url, headers, callback ) {
    Request.execute( {
      url : url,
      headers : headers,
      method : 'GET',
      complete : callback
    } );
  },
  post : function( url, payload, headers, callback ) {
    Request.execute( {
      url : url,
      data : payload,
      headers : headers,
      method : 'POST',
      complete : callback
    } );
  },
  delete : function( url, headers, callback ) {
    Request.execute( {
      url : url,
      headers : headers,
      method : 'DELETE',
      complete : callback
    } );
  }
};

const Ubidots = {
  VERSION : '0.0.2',
  Constants : {
    //API_URL : 'http://things.ubidots.com/api/v1.6/'
    //API_URL : 'https://things.ubidots.com/api/v1.6/'
    API_URL : '//things.ubidots.com/api/v1.6/'
  },
  ApiClient : function( apiKey, token, baseUrl, bridgeParam ) {
    let bridge = bridgeParam;
    
    if ( !( bridge instanceof Ubidots.ServerBridge ) ) {
      bridge = new Ubidots.ServerBridge( apiKey, token, baseUrl );
    }
    
    this.getDatasources = function( callback ) {
      bridge.get( 'datasources', function( response ) {
        const rawItems = response[ 'results' ];
        
        callback( bridge.transformToDatasourceObjects( rawItems ) );
      } );
    };
    
    this.getVariables = function( callback ) {
      bridge.get( 'variables', function( response ) {
        const rawItems = response[ 'results' ];
        
        callback( bridge.transformToVariableObjects( rawItems ) );
      } );
    };
    
    this.getDatasource = function( id, callback ) {
      const endpoint = 'datasources/' + id;
      
      bridge.get( endpoint, function( response ) {
        callback( new Ubidots.Datasource( bridge, response ) );
      } );
    };
    
    this.createDatasource = function( data, callback ) {
      const endpoint = 'datasources';
      
      bridge.post( endpoint, data, function( response ) {
        callback( new Ubidots.Datasource( bridge, response ) );
      } );
    };
    
    this.getVariable = function( id, callback ) {
      const endpoint = 'variables/' + id;
      
      bridge.get( endpoint, function( response ) {
        callback( new Ubidots.Variable( bridge, response ) );
      } );
    };
  },
  Datasource : function( bridgeParam, data ) {
    const self = this;
    const bridge = bridgeParam;
    this.id = data[ 'id' ];
    this.name = data[ 'name' ];
    this.url = data[ 'url' ];
    this.lastActivity = data[ 'last_activity' ];
    this.tags = data[ 'tags' ];
    this.description = data[ 'description' ];
    this.createdAt = data[ 'created_at' ];
    this.owner = data[ 'owner' ];
    this.parent = data[ 'parent' ];
    this.context = data[ 'context' ];
    this.variablesUrl = data[ 'variables_url' ];
    this.numberOfVariables = data[ 'number_of_variables' ];
    
    this.getVariables = function( callback ) {
      const endpoint = 'datasources/' + self.id + '/variables';
      
      bridge.get( endpoint, function( response ) {
        const rawItems = response[ 'results' ];
        
        callback( bridge.transformToVariableObjects( rawItems ) );
      } );
    };
    
    this.removeDatasource = function() {
      const endpoint = 'datasources/' + self.id;
      
      bridge.delete( endpoint );
    };
    
    this.createVariable = function( data, callback ) {
      const endpoint = 'datasources/' + self.id + '/variables';
      
      bridge.post( endpoint, data, function( response ) {
        callback( new Ubidots.Variable( bridge, response ) );
      } );
    };
  },
  ServerBridge : function( apiKeyParam, tokenParam, baseUrlParam ) {
    const self = this;
    const baseUrl = ( typeof( baseUrlParam ) === 'string' ) ? baseUrlParam : Ubidots.Constants.API_URL;
    let apiKey = undefined;
    let token = undefined;
    let apiKeyHeader = {};
    let tokenHeader = {};
    
    const getToken = function( callback ) {
      const endpoint = 'auth/token/';
      
      self.postWithApiKey( endpoint, function( response ) {
        token = response[ 'token' ];
        if ( typeof( callback ) === 'function' ) { callback( token ); }
      } );
    };
    
    const setApiKeyHeader = function() {
      apiKeyHeader = {
        'X-UBIDOTS-APIKEY' : apiKey
      };
    };
    
    const setTokenHeader = function() {
      tokenHeader = {
        'X-AUTH-TOKEN' : token
      };
    };
    
    const prepareData = function( data ) {
      return( data );
    };
    
    this.transformToDatasourceObjects = function( rawItems ) {
      let datasources = [];
      
      jQuery.each( rawItems, function( i, rawItem ) {
        datasources[ i ] = new Ubidots.Datasource( self, rawItem );
      } );
      
      return( datasources );
    };
    
    this.transformToVariableObjects = function( rawItems ) {
      let variables = [];
      
      jQuery.each( rawItems, function( i, rawItem ) {
        variables[ i ] = new Ubidots.Variable( self, rawItem );
      } );
      
      return( variables );
    };
    
    this.postWithApiKey = function( endpoint, callback ) {
      const headers = apiKeyHeader;
      
      RestClient.post( ( baseUrl + endpoint ), {}, headers, function( jqXHR, textStatus ) {
        if ( textStatus === 'success' ) {
          callback( jqXHR.responseJSON );
        }
      } );
    };
    
    this.get = function( endpoint, callback ) {
      const headers = tokenHeader;
      
      RestClient.get( ( baseUrl + endpoint ), headers, function( jqXHR, textStatus ) {
        if ( textStatus === 'success' ) {
          callback( jqXHR.responseJSON );
        }
      } );
    };
    
    this.getWithUrl = function( url, callback ) {
      const headers = tokenHeader;
      
      RestClient.get( url, headers, function( jqXHR, textStatus ) {
        if ( textStatus === 'success' ) {
          callback( jqXHR.responseJSON );
        }
      } );
    };
    
    this.post = function( endpoint, data, callback ) {
      const headers = tokenHeader;
      const data = prepareData( data );
      
      RestClient.post( ( baseUrl + endpoint ), data, headers, function( jqXHR, textStatus ) {
        if ( textStatus === 'success' ) {
          callback( jqXHR.responseJSON );
        }
      } );
    };
    
    this.delete = function( endpoint ) {
      const headers = tokenHeader;
      
      RestClient.delete( ( baseUrl + endpoint ), headers );
    };
    
    if ( typeof( apiKeyParam ) === 'string' ) {
      apiKey = apiKeyParam;
      setApiKeyHeader();
      getToken( setTokenHeader );
    } else if ( typeof( token ) === 'string' ) {
      token = tokenParam;
      setTokenHeader();
    }
  },
  Variable : function( bridgeParam, data ) {
    const self = this;
    const bridge = bridgeParam;
    const datasource = undefined;
    this.id = data[ 'id' ];
    this.name = data[ 'name' ];
    this.url = data[ 'url' ];
    this.lastActivity = data[ 'last_activity' ];
    this.tags = data[ 'tags' ];
    this.description = data[ 'description' ];
    this.createdAt = data[ 'created_at' ];
    this.icon = data[ 'icon' ];
    this.unit = data[ 'unit' ];
    this.rawDatasource = data[ 'datasource' ];
    this.properties = data[ 'properties' ];
    this.valuesUrl = data[ 'values_url' ];
    this.lastValue = data[ 'last_value' ];
    
    this.getValues = function( callback ) {
      const endpoint = 'variables/' + self.id + '/values';
      
      bridge.get( endpoint, function( response ) {
        callback( response[ 'results' ] );
      } );
    };
    
    this.saveValue = function( data, callback ) {
      const endpoint = 'variables/' + self.id + '/values';
      
      bridge.post( endpoint, data, callback );
    };
    
    this.saveValues = function( data, force, callback ) {
      const endpoint = 'variables/' + self.id + '/values';
      
      if ( force === true ) {
        endpoint = endpoint + '?force=true';
      }
      
      bridge.post( endpoint, data, callback );
    };
    
    this.removeVariable = function() {
      const endpoint = 'variables/' + self.id;
      
      bridge.delete( endpoint );
    };
    
    this.getDatasource = function( callback ) {
      if ( typeof( datasource ) === 'undefined' ) {
        const datasourceId = self.rawDatasource[ 'id' ];
        const endpoint = 'datasources/' + datasourceId;
        
        bridge.get( endpoint, function( response ) {
          callback( new Ubidots.Datasource( bridge, response ) );
        } );
      } else {
        callback( datasource );
      }
    };
  }
};
