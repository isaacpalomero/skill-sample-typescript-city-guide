/* eslint-disable  func-names */
/* eslint-disable  no-console */
/* eslint-disable  no-use-before-define */

// City Guide: A sample Alexa Skill Lambda function
//  This function shows how you can manage data in objects and arrays,
//   choose a random recommendation,
//   call an external API and speak the result,
//   handle YES/NO intents with session attributes,
//   and return text data on a card.

// tslint:disable-next-line: no-var-requires
const i18n = require("i18next");
import { Response, SessionEndedRequest, IntentRequest } from "ask-sdk-model";
import {
    SkillBuilders,
    RequestInterceptor,
    RequestHandler,
    HandlerInput,
    ErrorHandler,
} from "ask-sdk-core";
// tslint:disable-next-line: no-var-requires
import i18next from "i18next";
import * as https from "https";

import * as sprintf from "i18next-sprintf-postprocessor";
import { RequestAttributes } from "./interfaces";

// 1. Handlers ===================================================================================

class LaunchHandler implements RequestHandler {
    public canHandle(handlerInput: HandlerInput): boolean {
        const request = handlerInput.requestEnvelope.request;

        return request.type === "LaunchRequest";
    }
    public async handle(handlerInput: HandlerInput): Promise<Response> {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const requestAttributes = attributesManager.getRequestAttributes();
        const speechOutput = `${requestAttributes.t("WELCOME")} ${requestAttributes.t("HELP")}`;
        return responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .getResponse();
    }
}

class AboutHandler implements RequestHandler {
    public canHandle(handlerInput: HandlerInput): boolean {
        const request = handlerInput.requestEnvelope.request;

        return request.type === "IntentRequest" && request.intent.name === "AboutIntent";
    }
    public async handle(handlerInput: HandlerInput): Promise<Response> {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const requestAttributes = attributesManager.getRequestAttributes();

        return responseBuilder
            .speak(requestAttributes.t("ABOUT"))
            .getResponse();
    }
}

class CoffeeHandler implements RequestHandler {
    public canHandle(handlerInput: HandlerInput): boolean {
        const request = handlerInput.requestEnvelope.request;

        return request.type === "IntentRequest" && request.intent.name === "CoffeeIntent";
    }
    public async handle(handlerInput: HandlerInput): Promise<Response> {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const sessionAttributes = attributesManager.getSessionAttributes();
        const restaurant = getRandomItem(getRestaurantsByMeal("coffee"));
        sessionAttributes.restaurant = restaurant.name;
        const speechOutput = `For a great coffee shop, I recommend, ${restaurant.name}. Would you like to hear more?`;

        return responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .getResponse();
    }
}

class BreakfastHandler implements RequestHandler {
    public canHandle(handlerInput: HandlerInput): boolean {
        const request = handlerInput.requestEnvelope.request;

        return request.type === "IntentRequest" && request.intent.name === "BreakfastIntent";
    }
    public async handle(handlerInput: HandlerInput): Promise<Response> {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const sessionAttributes = attributesManager.getSessionAttributes();
        const restaurant = getRandomItem(getRestaurantsByMeal("breakfast"));
        sessionAttributes.restaurant = restaurant.name;
        const speechOutput = `For breakfast, try this, ${restaurant.name}. Would you like to hear more?`;

        return responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .getResponse();
    }
}

class LunchHandler implements RequestHandler {
    public canHandle(handlerInput: HandlerInput): boolean {
        const request = handlerInput.requestEnvelope.request;

        return request.type === "IntentRequest" && request.intent.name === "LunchIntent";
    }
    public async handle(handlerInput: HandlerInput): Promise<Response> {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const sessionAttributes = attributesManager.getSessionAttributes();
        const restaurant = getRandomItem(getRestaurantsByMeal("lunch"));
        sessionAttributes.restaurant = restaurant.name;
        const speechOutput = `Lunch time! Here is a good spot. ${restaurant.name}. Would you like to hear more?`;

        return responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .getResponse();
    }
}

class DinnerHandler implements RequestHandler {
    public canHandle(handlerInput: HandlerInput): boolean {
        const request = handlerInput.requestEnvelope.request;

        return request.type === "IntentRequest" && request.intent.name === "DinnerIntent";
    }
    public async handle(handlerInput: HandlerInput): Promise<Response> {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const sessionAttributes = attributesManager.getSessionAttributes();
        const restaurant = getRandomItem(getRestaurantsByMeal("dinner"));
        sessionAttributes.restaurant = restaurant.name;
        const speechOutput = `Enjoy dinner at, ${restaurant.name}. Would you like to hear more?`;

        return responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .getResponse();
    }
}

class YesHandler implements RequestHandler {
    public canHandle(handlerInput: HandlerInput): boolean {
        const request = handlerInput.requestEnvelope.request;

        return request.type === "IntentRequest" && request.intent.name === "AMAZON.YesIntent";
    }
    public async handle(handlerInput: HandlerInput): Promise<Response> {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const sessionAttributes = attributesManager.getSessionAttributes();
        const restaurantName = sessionAttributes.restaurant;
        const restaurantDetails = getRestaurantByName(restaurantName)!;
        const speechOutput = `${restaurantDetails.name
            } is located at ${restaurantDetails.address
            }, the phone number is ${restaurantDetails.phone
            }, and the description is, ${restaurantDetails.description
            }  I have sent these details to the Alexa App on your phone.  Enjoy your meal!
        <say-as interpret-as="interjection">bon appetit</say-as>`;

        const card = `${restaurantDetails.name
            }\n${restaurantDetails.address
            }\n${data.city}, ${data.state} ${data.postcode
            }\nphone: ${restaurantDetails.phone}\n`;

        return responseBuilder
            .speak(speechOutput)
            .withSimpleCard(SKILL_NAME, card)
            .getResponse();
    }
}

class AttractionHandler implements RequestHandler {
    public canHandle(handlerInput: HandlerInput): boolean {
        const request = handlerInput.requestEnvelope.request;

        return request.type === "IntentRequest" && request.intent.name === "AttractionIntent";
    }
    public async handle(handlerInput: HandlerInput): Promise<Response> {
        const { intent } = handlerInput.requestEnvelope.request as IntentRequest;
        const responseBuilder = handlerInput.responseBuilder;

        let distance = 200;
        if (intent.slots && intent.slots.distance.value && intent.slots.distance.value !== "?") {
            distance = parseInt(intent.slots.distance.value, undefined);
        }

        const attraction = getRandomItem(getAttractionsByDistance(distance));

        const speechOutput = `Try ${
            attraction.name}, which is ${
            attraction.distance === "0" ? "right downtown. " : `${attraction.distance} miles away. Have fun! `
            }${attraction.description}`;

        return responseBuilder
            .speak(speechOutput)
            .getResponse();
    }
}

class GoOutHandler implements RequestHandler {
    public canHandle(handlerInput: HandlerInput): boolean {
        const request = handlerInput.requestEnvelope.request;

        return request.type === "IntentRequest" && request.intent.name === "GoOutIntent";
    }
    public async handle(handlerInput: HandlerInput): Promise<Response> {
        return new Promise((resolve) => {
            getWeather((localTime: any, currentTemp: any, currentCondition: any) => {
                const speechOutput = `It is ${localTime
                    } and the weather in ${data.city
                    } is ${
                    currentTemp} and ${currentCondition}`;
                resolve(handlerInput.responseBuilder.speak(speechOutput).getResponse());
            });
        });
    }
}

class HelpHandler implements RequestHandler {
    public canHandle(handlerInput: HandlerInput): boolean {
        const request = handlerInput.requestEnvelope.request;

        return request.type === "IntentRequest" && request.intent.name === "AMAZON.HelpIntent";
    }
    public async handle(handlerInput: HandlerInput): Promise<Response> {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const requestAttributes = attributesManager.getRequestAttributes();
        return responseBuilder
            .speak(requestAttributes.t("HELP"))
            .reprompt(requestAttributes.t("HELP"))
            .getResponse();
    }
}

class StopHandler implements RequestHandler {
    public canHandle(handlerInput: HandlerInput): boolean {
        const request = handlerInput.requestEnvelope.request;

        return request.type === "IntentRequest"
            && (request.intent.name === "AMAZON.NoIntent"
                || request.intent.name === "AMAZON.CancelIntent"
                || request.intent.name === "AMAZON.StopIntent");
    }
    public async handle(handlerInput: HandlerInput): Promise<Response> {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const requestAttributes = attributesManager.getRequestAttributes();
        return responseBuilder
            .speak(requestAttributes.t("STOP"))
            .getResponse();
    }
}

class SessionEndedHandler implements RequestHandler {
    public canHandle(handlerInput: HandlerInput): boolean {
        const request = handlerInput.requestEnvelope.request;

        return request.type === "SessionEndedRequest";
    }
    public async handle(handlerInput: HandlerInput): Promise<Response> {
        console.log(`Session ended with reason: ${(handlerInput.requestEnvelope.request as SessionEndedRequest).reason}`);

        return handlerInput.responseBuilder.getResponse();
    }
}

class CustomErrorHandler implements ErrorHandler {
    public canHandle(_handlerInput: HandlerInput): boolean {
        return true;
    }
    public handle(handlerInput: HandlerInput, error: Error): Response {
        const request = handlerInput.requestEnvelope.request;

        console.log(`Error handled: ${error.message}`);
        console.log(`Error stack: ${error.stack}`);
        console.log(` Original request was ${JSON.stringify(request, null, 2)}\n`);

        return handlerInput.responseBuilder
            .speak("Sorry, I can't understand the command. Please say again.")
            .reprompt("Sorry, I can't understand the command. Please say again.")
            .getResponse();
    }
}

class FallbackHandler implements RequestHandler {

    // 2018-May-01: AMAZON.FallackIntent is only currently available in en-US locale.

    //              This handler will not be triggered except in that locale, so it can be

    //              safely deployed for any locale.

    public canHandle(handlerInput: HandlerInput): boolean {

        const request = handlerInput.requestEnvelope.request;

        return request.type === "IntentRequest"

            && request.intent.name === "AMAZON.FallbackIntent";

    }
    public async handle(handlerInput: HandlerInput): Promise<Response> {

        return handlerInput.responseBuilder

            .speak(FALLBACK_MESSAGE)

            .reprompt(FALLBACK_REPROMPT)

            .getResponse();

    }

}

// 2. Constants ==================================================================================

const enData = {
    translation: {
        WELCOME: "Welcome to Gloucester Guide!",
        HELP: "Say about, to hear more about the city, or say coffee, breakfast, lunch, or dinner, to hear local restaurant suggestions, or say recommend an attraction, or say, go outside. ",
        ABOUT: "Gloucester Massachusetts is a city on the Atlantic Ocean.  A popular summer beach destination, Gloucester has a rich history of fishing and ship building.",
        STOP: "Okay, see you next time!",
    },
};

const languageStrings: i18next.Resource = {
    "en": enData,
};

interface IRestaurant {
    name: string;
    address: string;
    phone: string;
    meals: string;
    description: string;
}

interface IAttraction {
    name: string;
    description: string;
    distance: string;
}

interface IData {
    city: string;
    state: string;
    postcode: string;
    restaurants: IRestaurant[];
    attractions: IAttraction[];
}

const data: IData = {
    city: "Gloucester",
    state: "MA",
    postcode: "01930",
    restaurants: [
        {
            name: "Zeke's Place",
            address: "66 East Main Street",
            phone: "978-283-0474",
            meals: "breakfast, lunch",
            description: "A cozy and popular spot for breakfast.  Try the blueberry french toast!",
        },
        {
            name: "Morning Glory Coffee Shop",
            address: "25 Western Avenue",
            phone: "978-281-1851",
            meals: "coffee, breakfast, lunch",
            description: "A homestyle diner located just across the street from the harbor sea wall.",
        },
        {
            name: "Sugar Magnolias",
            address: "112 Main Street",
            phone: "978-281-5310",
            meals: "breakfast, lunch",
            description: "A quaint eatery, popular for weekend brunch.  Try the carrot cake pancakes.",
        },
        {
            name: "Seaport Grille",
            address: "6 Rowe Square",
            phone: "978-282-9799",
            meals: "lunch, dinner",
            description: "Serving seafood, steak and casual fare.  Enjoy harbor views on the deck.",
        },
        {
            name: "Latitude 43",
            address: "25 Rogers Street",
            phone: "978-281-0223",
            meals: "lunch, dinner",
            description: "Features artsy decor and sushi specials.  Live music evenings at the adjoining Minglewood Tavern.",
        },
        {
            name: "George's Coffee Shop",
            address: "178 Washington Street",
            phone: "978-281-1910",
            meals: "coffee, breakfast, lunch",
            description: "A highly rated local diner with generously sized plates.",
        },

    ],
    attractions: [
        {
            name: "Whale Watching",
            description: "Gloucester has tour boats that depart twice daily from Rogers street at the harbor.  Try either the 7 Seas Whale Watch, or Captain Bill and Sons Whale Watch. ",
            distance: "0",
        },
        {
            name: "Good Harbor Beach",
            description: "Facing the Atlantic Ocean, Good Harbor Beach has huge expanses of soft white sand that attracts hundreds of visitors every day during the summer.",
            distance: "2",
        },
        {
            name: "Rockport",
            description: "A quaint New England town, Rockport is famous for rocky beaches, seaside parks, lobster fishing boats, and several art studios.",
            distance: "4",
        },
        {
            name: "Fenway Park",
            description: "Home of the Boston Red Sox, Fenway park hosts baseball games From April until October, and is open for tours. ",
            distance: "38",
        },
    ],
};

const SKILL_NAME = "Gloucester Guide";
const FALLBACK_MESSAGE = `The ${SKILL_NAME} skill can\'t help you with that.  It can help you learn about Gloucester if you say tell me about this place. What can I help you with?`;
const FALLBACK_REPROMPT = "What can I help you with?";

// 3. Helper Functions ==========================================================================

const myAPI = {
    host: "query.yahooapis.com",
    port: 443,
    path: `/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22${encodeURIComponent(data.city)}%2C%20${data.state}%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys`,
    method: "GET",
};

function getRestaurantsByMeal(mealType: string) {
    const list: IRestaurant[] = [];
    data.restaurants.forEach((restaurant) => {
        if (restaurant.meals.search(mealType) > -1) {
            list.push(restaurant);
        }
    });
    return list;
}

function getRestaurantByName(restaurantName: string): IRestaurant | undefined {
    const restaurant = data.restaurants.find((object) => object.name === restaurantName);
    return restaurant;
}

function getAttractionsByDistance(maxDistance: number) {
    const list: IAttraction[] = [];
    data.attractions.forEach((attraction) => {
        if (parseInt(attraction.distance, 10) <= maxDistance) {
            list.push(attraction);
        }
    });
    return list;
}

function getWeather(callback: { (localTime: any, currentTemp: any, currentCondition: any): void; (arg0: any, arg1: any, arg2: any): void; }) {
    const req = https.request(myAPI, (res: { setEncoding: (arg0: string) => void; on: { (arg0: string, arg1: (chunk: any) => void): void; (arg0: string, arg1: () => void): void; }; }) => {
        res.setEncoding("utf8");
        let returnData = "";

        res.on("data", (chunk: string) => {
            returnData += chunk;
        });
        res.on("end", () => {
            const channelObj = JSON.parse(returnData).query.results.channel;

            let localTime = channelObj.lastBuildDate.toString();
            localTime = localTime.substring(17, 25).trim();

            const currentTemp = channelObj.item.condition.temp;

            const currentCondition = channelObj.item.condition.text;

            callback(localTime, currentTemp, currentCondition);
        });
    });
    req.end();
}

// getRandomItem
export function getRandomItem<T>(arrayOfItems: T[]) {
    // the argument is an array [] of words or phrases
    let i = 0;
    i = Math.floor(Math.random() * arrayOfItems.length);
    return (arrayOfItems[i]);
}

type TranslationFunction = (...args: any[]) => string;

/**
 * Adds translation functions to the RequestAttributes.
 */
export class LocalizationInterceptor implements RequestInterceptor {
    public async process(handlerInput: HandlerInput): Promise<void> {
        const t = await i18n.use(sprintf).init({
            lng: handlerInput.requestEnvelope.request.locale,
            overloadTranslationOptionHandler:
                sprintf.overloadTranslationOptionHandler,
            resources: languageStrings,
            returnObjects: true,
        });

        const attributes = handlerInput.attributesManager.getRequestAttributes() as RequestAttributes;
        attributes.t = (...args: any[]) => {
            return (t as TranslationFunction)(...args);
        };
        attributes.tr = (key: any) => {
            const result = t(key) as string[];
            return getRandomItem(result);
        };
    }
}

// 4. Export =====================================================================================
const skillBuilder = SkillBuilders.custom();
exports.handler = skillBuilder
    .addRequestHandlers(
        new LaunchHandler(),
        new AboutHandler(),
        new CoffeeHandler(),
        new BreakfastHandler(),
        new LunchHandler(),
        new DinnerHandler(),
        new YesHandler(),
        new AttractionHandler(),
        new GoOutHandler(),
        new HelpHandler(),
        new StopHandler(),
        new FallbackHandler(),
        new SessionEndedHandler(),
    )
    .addRequestInterceptors(new LocalizationInterceptor())
    .addErrorHandlers(new CustomErrorHandler())
    .lambda();
