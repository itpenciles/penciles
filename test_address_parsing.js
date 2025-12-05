
const parseAddress = (address) => {
    let address1 = '';
    let city = '';
    let state = '';
    let zip = '';

    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 3) {
        address1 = parts[0];
        city = parts[1];
        const stateZip = parts[2].split(' ');
        if (stateZip.length >= 2) {
            state = stateZip[0];
            zip = stateZip[1];
        } else {
            state = parts[2]; // Fallback
        }
    }

    return { address1, city, state, zip };
};

const address = "143 Gale St, Akron, OH 44302";
const parsed = parseAddress(address);
console.log("Input:", address);
console.log("Parsed:", parsed);

const encodedAddress1 = encodeURIComponent(parsed.address1);
const encodedCity = encodeURIComponent(parsed.city);
const encodedState = encodeURIComponent(parsed.state);
const encodedZip = encodeURIComponent(parsed.zip);

const url = `https://api.gateway.attomdata.com/property/v2/salescomparables/address/${encodedAddress1}/${encodedCity}/US/${encodedState}/${encodedZip}`;
console.log("URL:", url);
