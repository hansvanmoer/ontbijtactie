// Price per adult breakfast in euro
const breakfastPriceAdult = 14.0;

// Price per child breakfast in euro
const breakfastPriceChild = 10.0;

// Discount in euro for takeaways
const takeAwayDiscount = 1.0;

// The index of the email address in the response value array
const emailAddressIndex = 1;

// The index of the last name in the response value array
const lastNameIndex = 2;

// The index of the first name in the response value array
const firstNameIndex = 3;

// The index of the community in the response value array
const communityIndex = 6;

// The index of the street in the response value array
const streetIndex = 7;

// The index of the address number in the response value array
const numberIndex = 8;

// The index of the delivery method in in the response value array
const deliveryMethodIndex = 5;

// The index of the shift
const shiftIndex = 9;

// The index of the number of adult breakfasts in the response value array
const adultCountIndex = 10;

// The is the index of the number of child breakfasts in in the response value array
const childCountIndex = 11;

// Shift regex
const shiftRegex = /(\d{2}:\d{2}) - (\d{2}:\d{2})/m;

// Which value denotes a takeaway
const takeAwayDeliveryMethodValue = "Afhalen";

// Takeaway address
const takeAwayAddress = "Glazenleeuwstraat 94, 9120 Beveren (ingang langs de oprit)";

// Action date
const actionDate = "24 maart 2024";

// Account number for payment
const accountNumber = "BE46 7350 4380 0336";

// Subject of the confirmation mail
const confirmationSubject = "Bevestiging inschrijving ontbijtactie VZW Scouts Sint-Raphaël";

//
// Processes a form submission response
//
function processReservation(event) {
  console.info("processing reservation");
  console.info(event.values);
  
  // fetch values from input, unfortunately this is rather primitive in spreadsheet events
  console.log(event.namedValues);
  const emailAddress = event.values[emailAddressIndex];
  const firstName = event.values[firstNameIndex];
  const lastName = event.values[lastNameIndex];
  const adultCount = parseInt(event.values[adultCountIndex]);
  const childCount = parseInt(event.values[childCountIndex]);
  const deliveryMethod = event.values[deliveryMethodIndex];
  const shift = event.values[shiftIndex];
  const community = event.values[communityIndex];
  const street = event.values[streetIndex];
  const number = event.values[numberIndex];

  // validation

  if(isNaN(adultCount)){
    printError("invalid adult breakfast count", event.values);
    throw new Error("invalid adult breakfast count");
  }
  if(isNaN(childCount)){
    printError("invalid child breakfast count", event.values);
    throw new Error("invalid child breakfast count");
  }

  // technically not an error
  if(adultCount == 0 && childCount == 0) {
    printError("registration detected with no actual orders", event.values);
    return;
  }

  const times = parseShift(shift);
  if(times == null){
    printError("invalid shift", event.values);
    throw new Error("invalid shift");
  }
  
  // create relevant confirmation values

  const name = createName(firstName, lastName);
  const address = createAddress(community, street, number);
  const body = createConfirmationBody(adultCount, childCount, isTakeAway(deliveryMethod), times, name, address);

  // send the email
  MailApp.sendEmail({
    to: emailAddress,
    subject: confirmationSubject,
    htmlBody: body
  });
}

//
// Creates a confirmation email body
//
function createConfirmationBody(adultCount, childCount, takeaway, times, name, address) {
  // TODO: somewhat sloppy => rework to use templates
  const adultAmount = adultCount * breakfastPriceAdult;
  const childAmount = childCount * breakfastPriceChild;
  const discount = takeaway ?  (adultCount + childCount) * takeAwayDiscount : 0.0;
  const totalAmount = adultAmount + childAmount - discount;

  let body = Utilities.formatString("<p>Beste %s,</p>", name);
  body += "<p/>";
  body += "<p>Hartelijk dank voor uw bestelling!</p>";
  body += "<p>Hieronder vindt u nog een overzicht van uw bestelling:</p>";

  body += "<ul>";
  if(adultCount != 0) {
    body += Utilities.formatString("<li>Ontbijt volwassenen: %d = %d euro</li>", adultCount, adultAmount);
  }
  if(childCount != 0) {
    body += Utilities.formatString("<li>Ontbijt kinderen: %d = %d euro</li>", childCount, childAmount);
  }
  if(takeaway){
    body += Utilities.formatString("<li>Korting afhaling: %d euro</li>", - discount);
  }
  body += "</ul>"

  body += Utilities.formatString("<p>Totaalbedrag: %d euro</p>", totalAmount);

  // use bold tag instead of CSS to please both GMail and Outlook
  body += Utilities.formatString("<p><b>Gelieve het totaalbedrag van %s EURO over te schrijven naar rekeningnummer %s met vermelding van uw volledige naam.</b></p>", totalAmount, accountNumber);
  body += "<p><b>Uw reservatie is pas definitief als wij de betaling ontvangen hebben.</b></p>";

  if(takeaway){
    body += Utilities.formatString("<p>U kan uw bestelling afhalen op %s tussen %s en %s uur op %s.</p>", actionDate, times.start, times.end, takeAwayAddress);
  } else {
    body += Utilities.formatString("<p>Uw bestelling zal worden geleverd op %s tussen %s en %s uur op %s.</p>", actionDate, times.start, times.end, address);
  }
  body += "<p/>";
  body += "<p>Bedankt voor uw steun en smakelijk!</p><p>VZW Scouts Sint Raphael</p>";
  return body;
}

//
// Parses the shift
//
function parseShift(shift) {
  const values = shift.match(shiftRegex);
  if(values.length == 3){
    return {
      start : values[1],
      end: values[2]
    };
  } else {
    //something went wrong
    console.warn("invalid shift: " + shift);
    return null;
  }
}

//
// Creates a name
//
function createName(firstName, lastName) {
  return firstName + " " + lastName;
}

//
// Creates a formatted address string
//
function createAddress(community, street, number) {
  return street + " " + number + " " + community;
}

//
// Checks whether a destination is a takeaway destination
//
function isTakeAway(deliveryMethod) {
  return deliveryMethod === takeAwayDeliveryMethodValue;
}

//
// Prints a full error log entry to recover faulty input after the fact
// 
function printError(message, input){
  console.error(message +" : input was: " + JSON.stringify(input));
}
