import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";

export type CountryPhoneCode = {
  code: CountryCode;
  name: string;
  flag: string;
  dialCode: string;
};

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

function getFlag(code: CountryCode) {
  return String.fromCodePoint(
    ...code.split("").map((letter) => 127397 + letter.charCodeAt(0)),
  );
}

export const countryPhoneCodes: CountryPhoneCode[] = getCountries()
  .map((code) => ({
    code,
    name: countryNames.of(code) ?? code,
    flag: getFlag(code),
    dialCode: `+${getCountryCallingCode(code)}`,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const defaultCountryCode: CountryCode = "MM";
