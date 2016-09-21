String.prototype.hexEncode = function(){
    var hex, i;
    var result = "";
    for (i=0; i<this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }
    return result;
};
String.prototype.hexDecode = function(){
    var j;
    var hexes = this.match(/.{1,4}/g) || [];
    var back = "";
    for(j = 0; j<hexes.length; j++) {
        back += String.fromCharCode(parseInt(hexes[j], 16));
    }
    return back;
};


surrogateToCodePoint = function(h, l) {
    return (h - 0xD800) * 0x400 + l - 0xDC00 + 0x10000;
};

codePointToSurrogate = function(c) {
    var h = Math.floor((c - 0x10000) / 0x400) + 0xD800;
    var l = (c - 0x10000) % 0x400 + 0xDC00;
    return "&#x" + h.toString(16).toUpperCase() + ";&#x" + l.toString(16).toUpperCase() + ";";
};