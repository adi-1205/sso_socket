ReE = function (res, err, code) {
  // Error Web Response
  if (typeof err == "object" && typeof err.message != "undefined") {
    err = err.message;
  }
  if (typeof code !== "undefined") res.statusCode = code;

  return res.json({ success: false, message: err });
};

ReS = function (res, msg, data, code) {
  // Success Web Response
  let send_data = { success: true, message: msg };
  if (typeof data == "object") {
    send_data = Object.assign(data, send_data); //merge the objects
  }
  if (typeof code !== "undefined") res.statusCode = code;

  return res.json(send_data);
};

// Generate an array with given params range(3)=>[0,1,2], range(2,6)=>[2,3,4,5], range(1,10,2)=>[1,3,5,7,9]
range = (start, stop, step) => {
  if (typeof stop == 'undefined') {
    stop = start;
    start = 0;
  }
  if (typeof step == 'undefined') {
    step = 1;
  }
  if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
    return [];
  }
  var result = [];
  for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
    result.push(i);
  }
  return result;
};

module.exports = {
  ReS,
  ReE,
  range,
}