#include "json2.js"

var TAG_GRID = 'guidr:grid';
var TAG_MANUAL = 'guidr:manual';
var TAG_PREVIEW_GRID = 'guidr:preview:grid';
var TAG_PREVIEW_MANUAL = 'guidr:preview:manual';

function getDoc() {
  if (app.documents.length === 0) return null;
  return app.activeDocument;
}

function unitStr(u) {
  switch (u) {
    case 'px': return 'px';
    case 'mm': return 'mm';
    case 'cm': return 'cm';
    case 'pt': return 'pt';
    default: return 'px';
  }
}

function toPoints(val, unit) {
  switch (unit) {
    case 'mm': return val * 2.834645669;
    case 'cm': return val * 28.34645669;
    case 'pt': return val;
    default: return val;
  }
}

function resolveArtboards(doc, abTarget, abIndex) {
  if (abTarget === 'all') {
    var indices = [];
    for (var i = 0; i < doc.artboards.length; i++) {
      indices.push(i);
    }
    return indices;
  }
  if (abTarget === 'select') {
    return [abIndex];
  }
  return [doc.artboards.getActiveArtboardIndex()];
}

function hexToRGBColor(hex) {
  hex = hex.replace('#', '');
  var r = parseInt(hex.substring(0, 2), 16);
  var g = parseInt(hex.substring(2, 4), 16);
  var b = parseInt(hex.substring(4, 6), 16);
  var c = new RGBColor();
  c.red = r;
  c.green = g;
  c.blue = b;
  return c;
}

function addGuide(layer, orientation, coord, tag, color) {
  var item = layer.pathItems.add();
  item.guides = true;
  item.pixelAligned = false;
  item.note = tag;
  if (color) {
    try {
      item.strokeColor = hexToRGBColor(color);
    } catch (e) {}
  }
  if (orientation === 'h') {
    item.setEntirePath([[-1000000, coord], [1000000, coord]]);
  } else {
    item.setEntirePath([[coord, 1000000], [coord, -1000000]]);
  }
}

function applyGridToRect(layer, rect, margins, grid, unit, color, tag) {
  if (!tag) tag = TAG_GRID;
  var mT = toPoints(margins.uniform ? margins.all : margins.top, unit);
  var mB = toPoints(margins.uniform ? margins.all : margins.bottom, unit);
  var mL = toPoints(margins.uniform ? margins.all : margins.left, unit);
  var mR = toPoints(margins.uniform ? margins.all : margins.right, unit);

  var aL = rect[0];
  var aT = rect[1];
  var aR = rect[2];
  var aB = rect[3];

  if (mT > 0) addGuide(layer, 'h', aT - mT, tag, color);
  if (mB > 0) addGuide(layer, 'h', aB + mB, tag, color);
  if (mL > 0) addGuide(layer, 'v', aL + mL, tag, color);
  if (mR > 0) addGuide(layer, 'v', aR - mR, tag, color);

  var iL = aL + mL;
  var iR = aR - mR;
  var iT = aT - mT;
  var iB = aB + mB;
  var iW = iR - iL;
  var iH = iT - iB;

  var cols = grid.colCount || 0;
  var rows = grid.rowCount || 0;
  var colG = toPoints(grid.colGutter || 0, unit);
  var rowG = toPoints(grid.rowGutter || 0, unit);

  if (cols > 1 && iW > 0) {
    var colW = (iW - colG * (cols - 1)) / cols;
    for (var c = 1; c < cols; c++) {
      var x = iL + c * colW + (c - 1) * colG;
    addGuide(layer, 'v', x, tag, color);
    if (colG > 0) {
      addGuide(layer, 'v', x + colG, tag, color);
      }
    }
  }

  if (rows > 1 && iH > 0) {
    var rowH = (iH - rowG * (rows - 1)) / rows;
    for (var r = 1; r < rows; r++) {
      var y = iT - r * rowH - (r - 1) * rowG;
    addGuide(layer, 'h', y, tag, color);
    if (rowG > 0) {
      addGuide(layer, 'h', y - rowG, tag, color);
      }
    }
  }
}

function guidr_applyGrid(marginsJSON, gridJSON, unit, abTarget, abIndex, color) {
  try {
    hostLog('applyGrid called | margins=' + marginsJSON + ' | grid=' + gridJSON + ' | unit=' + unit + ' | abTarget=' + abTarget + ' | abIndex=' + abIndex + ' | color=' + color);
    var doc = getDoc();
    if (!doc) return JSON.stringify({ success: false, error: 'no_doc' });
    var layer = doc.activeLayer;
    if (layer.locked || !layer.visible) {
      return JSON.stringify({ success: false, error: 'layer_locked' });
    }
    var margins = JSON.parse(marginsJSON);
    var grid = JSON.parse(gridJSON);
    var abTargetVal = abTarget || 'active';
    var abIndexVal = parseInt(abIndex) || 0;
    var indices = resolveArtboards(doc, abTargetVal, abIndexVal);
    hostLog('Parsed margins: uniform=' + margins.uniform + ' all=' + margins.all + ' | grid: cols=' + grid.colCount + ' rows=' + grid.rowCount);

    app.beginUndoGroup && app.beginUndoGroup('Guidr: Apply Grid');
    for (var i = 0; i < indices.length; i++) {
      var ab = doc.artboards[indices[i]];
      var rect = ab.artboardRect;
      hostLog('Artboard rect: ' + rect[0] + ',' + rect[1] + ',' + rect[2] + ',' + rect[3]);
      applyGridToRect(layer, rect, margins, grid, unit, color);
    }
    app.endUndoGroup && app.endUndoGroup();
    return JSON.stringify({ success: true, data: 'ok' });
  } catch (e) {
    hostLog('applyGrid ERROR: ' + e.message);
    return JSON.stringify({ success: false, error: e.message });
  }
}

function guidr_previewGrid(marginsJSON, gridJSON, unit, abTarget, abIndex, color) {
  try {
    hostLog('previewGrid called');
    var doc = getDoc();
    if (!doc) return JSON.stringify({ success: false, error: 'no_doc' });
    var layer = doc.activeLayer;
    if (layer.locked || !layer.visible) {
      return JSON.stringify({ success: false, error: 'layer_locked' });
    }
    var margins = JSON.parse(marginsJSON);
    var grid = JSON.parse(gridJSON);
    var abTargetVal = abTarget || 'active';
    var abIndexVal = parseInt(abIndex) || 0;

    app.beginUndoGroup && app.beginUndoGroup('Guidr: Preview Grid');
    clearFiltered(doc, abTargetVal, abIndexVal, 'preview:grid', 'all');
    var indices = resolveArtboards(doc, abTargetVal, abIndexVal);
    for (var i = 0; i < indices.length; i++) {
      var ab = doc.artboards[indices[i]];
      applyGridToRect(layer, ab.artboardRect, margins, grid, unit, color, TAG_PREVIEW_GRID);
    }
    app.endUndoGroup && app.endUndoGroup();
    return JSON.stringify({ success: true, data: 'ok' });
  } catch (e) {
    hostLog('previewGrid ERROR: ' + e.message);
    return JSON.stringify({ success: false, error: e.message });
  }
}

function guidr_applyManualGuides(guidesJSON, unit, abTarget, abIndex, color) {
  try {
    var doc = getDoc();
    if (!doc) return JSON.stringify({ success: false, error: 'no_doc' });
    var layer = doc.activeLayer;
    if (layer.locked || !layer.visible) {
      return JSON.stringify({ success: false, error: 'layer_locked' });
    }
    var guides = JSON.parse(guidesJSON);
    var abTargetVal = abTarget || 'active';
    var abIndexVal = parseInt(abIndex) || 0;
    var indices = resolveArtboards(doc, abTargetVal, abIndexVal);

    app.beginUndoGroup && app.beginUndoGroup('Guidr: Apply Manual Guides');
    for (var i = 0; i < indices.length; i++) {
      var ab = doc.artboards[indices[i]];
      var rect = ab.artboardRect;
      var aL = rect[0], aT = rect[1], aR = rect[2], aB = rect[3];

      for (var j = 0; j < guides.length; j++) {
        var g = guides[j];
        var pos = toPoints(g.position, unit);
        var coord;
        if (g.orientation === 'h') {
          coord = g.origin === 'bottom' ? aB + pos : aT - pos;
        } else {
          coord = g.origin === 'right' ? aR - pos : aL + pos;
        }
        addGuide(layer, g.orientation, coord, TAG_MANUAL, color);
      }
    }
    app.endUndoGroup && app.endUndoGroup();
    return JSON.stringify({ success: true, data: 'ok' });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.message });
  }
}

function guidr_previewManualGuides(guidesJSON, unit, abTarget, abIndex, color) {
  try {
    hostLog('previewManualGuides called');
    var doc = getDoc();
    if (!doc) return JSON.stringify({ success: false, error: 'no_doc' });
    var layer = doc.activeLayer;
    if (layer.locked || !layer.visible) {
      return JSON.stringify({ success: false, error: 'layer_locked' });
    }
    var guides = JSON.parse(guidesJSON);
    var abTargetVal = abTarget || 'active';
    var abIndexVal = parseInt(abIndex) || 0;

    app.beginUndoGroup && app.beginUndoGroup('Guidr: Preview Guides');
    clearFiltered(doc, abTargetVal, abIndexVal, 'preview:manual', 'all');
    var indices = resolveArtboards(doc, abTargetVal, abIndexVal);
    for (var i = 0; i < indices.length; i++) {
      var ab = doc.artboards[indices[i]];
      var rect = ab.artboardRect;
      var aL = rect[0], aT = rect[1], aR = rect[2], aB = rect[3];

      for (var j = 0; j < guides.length; j++) {
        var g = guides[j];
        var pos = toPoints(g.position, unit);
        var coord;
        if (g.orientation === 'h') {
          coord = g.origin === 'bottom' ? aB + pos : aT - pos;
        } else {
          coord = g.origin === 'right' ? aR - pos : aL + pos;
        }
        addGuide(layer, g.orientation, coord, TAG_PREVIEW_MANUAL, color);
      }
    }
    app.endUndoGroup && app.endUndoGroup();
    return JSON.stringify({ success: true, data: 'ok' });
  } catch (e) {
    hostLog('previewManualGuides ERROR: ' + e.message);
    return JSON.stringify({ success: false, error: e.message });
  }
}

function guidr_commitPreview(tagFilter, abTarget, abIndex) {
  try {
    hostLog('commitPreview called | tagFilter=' + tagFilter);
    var doc = getDoc();
    if (!doc) return JSON.stringify({ success: false, error: 'no_doc' });
    var abTargetVal = abTarget || 'active';
    var abIndexVal = parseInt(abIndex) || 0;
    var targetIndices = resolveArtboards(doc, abTargetVal, abIndexVal);
    var count = 0;

    app.beginUndoGroup && app.beginUndoGroup('Guidr: Commit Preview');

    for (var li = 0; li < doc.layers.length; li++) {
      var layer = doc.layers[li];
      for (var pi = layer.pathItems.length - 1; pi >= 0; pi--) {
        var item = layer.pathItems[pi];
        if (!item.guides) continue;

        var shouldRename = false;
        if (tagFilter === 'grid' && item.note === TAG_PREVIEW_GRID) {
          item.note = TAG_GRID;
          shouldRename = true;
        } else if (tagFilter === 'manual' && item.note === TAG_PREVIEW_MANUAL) {
          item.note = TAG_MANUAL;
          shouldRename = true;
        } else if (tagFilter === 'all') {
          if (item.note === TAG_PREVIEW_GRID) {
            item.note = TAG_GRID;
            shouldRename = true;
          } else if (item.note === TAG_PREVIEW_MANUAL) {
            item.note = TAG_MANUAL;
            shouldRename = true;
          }
        }

        if (shouldRename) {
          if (abTargetVal !== 'all') {
            var bounds = item.geometricBounds;
            var isH = Math.abs(bounds[1] - bounds[3]) < 1;
            var guideCoord = isH ? bounds[1] : bounds[0];
            var inBounds = false;
            for (var ai = 0; ai < targetIndices.length; ai++) {
              var r = doc.artboards[targetIndices[ai]].artboardRect;
              if (isH && guideCoord <= r[1] && guideCoord >= r[3]) { inBounds = true; break; }
              if (!isH && guideCoord >= r[0] && guideCoord <= r[2]) { inBounds = true; break; }
            }
            if (!inBounds) {
              if (item.note === TAG_GRID) item.note = TAG_PREVIEW_GRID;
              if (item.note === TAG_MANUAL) item.note = TAG_PREVIEW_MANUAL;
              shouldRename = false;
            }
          }
          if (shouldRename) count++;
        }
      }
    }

    app.endUndoGroup && app.endUndoGroup();
    hostLog('commitPreview renamed ' + count + ' guides');
    return JSON.stringify({ success: true, data: count });
  } catch (e) {
    hostLog('commitPreview ERROR: ' + e.message);
    return JSON.stringify({ success: false, error: e.message });
  }
}

function guidr_clearPreviewGuides(tagFilter, abTarget, abIndex) {
  try {
    var doc = getDoc();
    if (!doc) return JSON.stringify({ success: false, error: 'no_doc' });
    var filter = tagFilter || 'preview:all';
    if (filter === 'grid') filter = 'preview:grid';
    if (filter === 'manual') filter = 'preview:manual';
    clearFiltered(doc, abTarget, abIndex, filter, 'all');
    return JSON.stringify({ success: true, data: 'ok' });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.message });
  }
}

function guidr_addCenterGuides(abTarget, abIndex, color) {
  try {
    var doc = getDoc();
    if (!doc) return JSON.stringify({ success: false, error: 'no_doc' });
    var layer = doc.activeLayer;
    var abTargetVal = abTarget || 'active';
    var abIndexVal = parseInt(abIndex) || 0;
    var indices = resolveArtboards(doc, abTargetVal, abIndexVal);

    app.beginUndoGroup && app.beginUndoGroup('Guidr: Center Guides');
    for (var i = 0; i < indices.length; i++) {
      var ab = doc.artboards[indices[i]];
      var rect = ab.artboardRect;
      var cx = (rect[0] + rect[2]) / 2;
      var cy = (rect[1] + rect[3]) / 2;
      addGuide(layer, 'v', cx, TAG_MANUAL, color);
      addGuide(layer, 'h', cy, TAG_MANUAL, color);
    }
    app.endUndoGroup && app.endUndoGroup();
    return JSON.stringify({ success: true, data: 'ok' });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.message });
  }
}

function clearFiltered(doc, abTarget, abIndex, tagFilter, orientFilter) {
  app.beginUndoGroup && app.beginUndoGroup('Guidr: Clear Guides');
  var abTargetVal = abTarget || 'active';
  var abIndexVal = parseInt(abIndex) || 0;
  var targetIndices = resolveArtboards(doc, abTargetVal, abIndexVal);
  var toRemove = [];

  for (var li = 0; li < doc.layers.length; li++) {
    var layer = doc.layers[li];
    for (var pi = layer.pathItems.length - 1; pi >= 0; pi--) {
      var item = layer.pathItems[pi];
      if (!item.guides) continue;

if (tagFilter === 'grid' && item.note !== TAG_GRID && item.note !== TAG_PREVIEW_GRID) continue;
if (tagFilter === 'manual' && item.note !== TAG_MANUAL && item.note !== TAG_PREVIEW_MANUAL) continue;
if (tagFilter === 'preview:grid' && item.note !== TAG_PREVIEW_GRID) continue;
if (tagFilter === 'preview:manual' && item.note !== TAG_PREVIEW_MANUAL) continue;
if (tagFilter === 'preview:all' && item.note !== TAG_PREVIEW_GRID && item.note !== TAG_PREVIEW_MANUAL) continue;

      var bounds = item.geometricBounds;
      var isH = Math.abs(bounds[1] - bounds[3]) < 1;
      if (orientFilter === 'h' && !isH) continue;
      if (orientFilter === 'v' && isH) continue;

      if (abTargetVal !== 'all') {
        var guideCoord = isH ? bounds[1] : bounds[0];
        var inBounds = false;
        for (var ai = 0; ai < targetIndices.length; ai++) {
          var r = doc.artboards[targetIndices[ai]].artboardRect;
          if (isH && guideCoord <= r[1] && guideCoord >= r[3]) { inBounds = true; break; }
          if (!isH && guideCoord >= r[0] && guideCoord <= r[2]) { inBounds = true; break; }
        }
        if (!inBounds) continue;
      }

      toRemove.push(item);
    }
  }

  for (var ri = 0; ri < toRemove.length; ri++) {
    toRemove[ri].remove();
  }
  app.endUndoGroup && app.endUndoGroup();
}

function guidr_clearGridGuides(abTarget, abIndex) {
  try {
    var doc = getDoc();
    if (!doc) return JSON.stringify({ success: false, error: 'no_doc' });
    clearFiltered(doc, abTarget, abIndex, 'grid', 'all');
    return JSON.stringify({ success: true, data: 'ok' });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.message });
  }
}

function guidr_clearManualGuides(abTarget, abIndex) {
  try {
    var doc = getDoc();
    if (!doc) return JSON.stringify({ success: false, error: 'no_doc' });
    clearFiltered(doc, abTarget, abIndex, 'manual', 'all');
    return JSON.stringify({ success: true, data: 'ok' });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.message });
  }
}

function guidr_clearManualH(abTarget, abIndex) {
  try {
    var doc = getDoc();
    if (!doc) return JSON.stringify({ success: false, error: 'no_doc' });
    clearFiltered(doc, abTarget, abIndex, 'manual', 'h');
    return JSON.stringify({ success: true, data: 'ok' });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.message });
  }
}

function guidr_clearManualV(abTarget, abIndex) {
  try {
    var doc = getDoc();
    if (!doc) return JSON.stringify({ success: false, error: 'no_doc' });
    clearFiltered(doc, abTarget, abIndex, 'manual', 'v');
    return JSON.stringify({ success: true, data: 'ok' });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.message });
  }
}

function guidr_clearAllGuides(abTarget, abIndex) {
  try {
    var doc = getDoc();
    if (!doc) return JSON.stringify({ success: false, error: 'no_doc' });
    clearFiltered(doc, abTarget, abIndex, 'all', 'all');
    return JSON.stringify({ success: true, data: 'ok' });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.message });
  }
}

function guidr_toggleVisibility() {
  try {
    app.executeMenuCommand('showguide');
    return JSON.stringify({ success: true, data: 'ok' });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.message });
  }
}

function guidr_getContext() {
  try {
    var doc = getDoc();
    if (!doc) return JSON.stringify({ success: false, error: 'no_doc' });
    var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()];
    var rect = ab.artboardRect;
    var w = Math.abs(rect[2] - rect[0]);
    var h = Math.abs(rect[1] - rect[3]);
    var rulerMap = {
      'RulerUnits.PIXELS': 'px',
      'RulerUnits.INCHES': 'in',
      'RulerUnits.CENTIMETERS': 'cm',
      'RulerUnits.MILLIMETERS': 'mm',
      'RulerUnits.POINTS': 'pt',
      'RulerUnits.Q': 'q'
    };
    var ruler = rulerMap[String(doc.rulerUnits)] || 'px';
    return JSON.stringify({
      success: true,
      data: {
        width: Math.round(w * 100) / 100,
        height: Math.round(h * 100) / 100,
        ruler: ruler,
        scaleFactor: 1,
        artboardCount: doc.artboards.length
      }
    });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.message });
  }
}

function getSelBounds(sel) {
  var l = Infinity, t = -Infinity, r = -Infinity, b = Infinity;
  for (var i = 0; i < sel.length; i++) {
    var gb = sel[i].geometricBounds;
    if (gb[0] < l) l = gb[0];
    if (gb[1] > t) t = gb[1];
    if (gb[2] > r) r = gb[2];
    if (gb[3] < b) b = gb[3];
  }
  return { left: l, top: t, right: r, bottom: b };
}

function getABRef(doc) {
  var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()];
  var rect = ab.artboardRect;
  return { left: rect[0], top: rect[1], right: rect[2], bottom: rect[3] };
}

function guidr_alignObjects(cmd, target) {
  try {
    var doc = getDoc();
    if (!doc) return JSON.stringify({ success: false, error: 'no_doc' });
    var sel = doc.selection;
    if (!sel || sel.length === 0) return JSON.stringify({ success: false, error: 'no_selection' });

    var ref = target === 'artboard' ? getABRef(doc) : getSelBounds(sel);
    var result = 'ok';

    app.beginUndoGroup && app.beginUndoGroup('Guidr: Align');
    for (var i = 0; i < sel.length; i++) {
      var gb = sel[i].geometricBounds;
      var newL = gb[0], newT = gb[1];
      switch (cmd) {
        case 'align-left': newL = ref.left; break;
        case 'align-right': newL = ref.right - (gb[2] - gb[0]); break;
        case 'align-center-h': newL = ref.left + (ref.right - ref.left) / 2 - (gb[2] - gb[0]) / 2; break;
        case 'align-top': newT = ref.top; break;
        case 'align-bottom': newT = ref.bottom + (gb[1] - gb[3]); break;
        case 'align-center-v': newT = ref.top + (ref.bottom - ref.top) / 2 + (gb[1] - gb[3]) / 2; break;
      }
      var dx = newL - gb[0];
      var dy = newT - gb[1];
      if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
        sel[i].translate(dx, dy);
      }
    }
    app.endUndoGroup && app.endUndoGroup();
    return JSON.stringify({ success: true, data: result });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.message });
  }
}

function guidr_alignCenterBoth(target) {
  try {
    var doc = getDoc();
    if (!doc) return JSON.stringify({ success: false, error: 'no_doc' });
    var sel = doc.selection;
    if (!sel || sel.length === 0) return JSON.stringify({ success: false, error: 'no_selection' });

    var ref = target === 'artboard' ? getABRef(doc) : getSelBounds(sel);

    app.beginUndoGroup && app.beginUndoGroup('Guidr: Center Both');
    for (var i = 0; i < sel.length; i++) {
      var gb = sel[i].geometricBounds;
      var cx = ref.left + (ref.right - ref.left) / 2 - (gb[2] - gb[0]) / 2;
      var cy = ref.top + (ref.bottom - ref.top) / 2 + (gb[1] - gb[3]) / 2;
      var dx = cx - gb[0];
      var dy = cy - gb[1];
      if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
        sel[i].translate(dx, dy);
      }
    }
    app.endUndoGroup && app.endUndoGroup();
    return JSON.stringify({ success: true, data: 'ok' });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.message });
  }
}

function guidr_distributeObjects(axis, spacingJSON, unit) {
  try {
    var doc = getDoc();
    if (!doc) return JSON.stringify({ success: false, error: 'no_doc' });
    var sel = doc.selection;
    if (!sel || sel.length < 2) return JSON.stringify({ success: false, error: 'need_2' });

    var items = [];
    for (var i = 0; i < sel.length; i++) {
      items.push({ item: sel[i], bounds: sel[i].geometricBounds });
    }

    if (axis === 'h') {
      items.sort(function(a, b) { return a.bounds[0] - b.bounds[0]; });
    } else {
      items.sort(function(a, b) { return b.bounds[1] - a.bounds[1]; });
    }

    app.beginUndoGroup && app.beginUndoGroup('Guidr: Distribute');

    var hasSpacing = spacingJSON && spacingJSON !== 'null' && spacingJSON !== 'undefined';
    var spacing = 0;
    if (hasSpacing) {
      spacing = toPoints(parseFloat(spacingJSON), unit);
    }

    if (axis === 'h') {
      for (var i = 1; i < items.length; i++) {
        if (hasSpacing) {
          var newX = items[i - 1].bounds[2] + spacing;
          var dx = newX - items[i].bounds[0];
          if (Math.abs(dx) > 0.001) items[i].item.translate(dx, 0);
        } else {
          var first = items[0].bounds[0];
          var last = items[items.length - 1].bounds[2];
          var totalW = 0;
          for (var j = 0; j < items.length; j++) {
            totalW += items[j].bounds[2] - items[j].bounds[0];
          }
          var gap = ((last - first) - totalW) / (items.length - 1);
          var cumX = items[0].bounds[2] + gap;
          for (var j = 1; j < items.length - 1; j++) {
            var dx = cumX - items[j].bounds[0];
            if (Math.abs(dx) > 0.001) items[j].item.translate(dx, 0);
            cumX = items[j].item.geometricBounds[2] + gap;
          }
        }
      }
    } else {
      for (var i = 1; i < items.length; i++) {
        if (hasSpacing) {
          var newY = items[i - 1].bounds[3] - spacing;
          var dy = newY - items[i].bounds[1];
          if (Math.abs(dy) > 0.001) items[i].item.translate(0, dy);
        } else {
          var first = items[0].bounds[1];
          var last = items[items.length - 1].bounds[3];
          var totalH = 0;
          for (var j = 0; j < items.length; j++) {
            totalH += items[j].bounds[1] - items[j].bounds[3];
          }
          var gap = ((first - last) - totalH) / (items.length - 1);
          var cumY = items[0].bounds[3] - gap;
          for (var j = 1; j < items.length - 1; j++) {
            var dy = cumY - items[j].item.geometricBounds[1];
            if (Math.abs(dy) > 0.001) items[j].item.translate(0, dy);
            cumY = items[j].item.geometricBounds[3] - gap;
          }
        }
      }
    }

    app.endUndoGroup && app.endUndoGroup();
    return JSON.stringify({ success: true, data: 'ok' });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.message });
  }
}

function hostLog(message) {
  try {
    var f = File(Folder.temp + '/guidr_host.log');
    f.open('a');
    f.write(new Date().toString() + ' | ' + message + '\n');
    f.close();
  } catch (e) {}
}
