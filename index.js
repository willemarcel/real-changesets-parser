var omit = require('lodash.omit');
var turf = require('@turf/helpers');
var createBbox = require('@turf/bbox');
var createBboxPolygon = require('@turf/bbox-polygon');

function RealChangesetsParser(json) {
  function createFeature(data) {
    switch(data.type) {
      case 'node':
        return createNode(data);
      case 'way':
        return createWay(data);
      case 'relation':
        return createRelation(data);
    }
  }

  function createNode(data) {
    var geometry = [data.lon, data.lat].map(parseFloat);
    var properties = omit(data, ['lon', 'lat']);
    return turf.point(geometry, properties);
  }

  function createWay(data) {
    var geometry = data.nodes.map(function(node) {
      return [node.lon, node.lat].map(parseFloat);
    });
    var properties = omit(data, ['nodes']);
    return turf.lineString(geometry, properties);
  }

  function createRelation(data) {
    data.relations = data.members.map(createFeature);
    var feature = createBboxPolygon(createBbox(turf.featureCollection(data.relations)));
    feature.properties = omit(data, ['members']);
    return feature;
  }

  // If the feature was deleted, copy its
  // geometry from the old feature
  if (json.action === 'delete') {
    switch(json.type) {
      case 'node':
        json.lon = json.old.lon;
        json.lat = json.old.lat;
        break;
      case 'way':
        json.nodes = json.old.nodes;
        break;
      case 'relation':
        json.members = json.old.members;
        break;
    }
  }

  return (
    'old' in json
      ? [omit(json, ['old']), json.old]
      : [json]
    ).map(createFeature);
}

module.exports = RealChangesetsParser;
