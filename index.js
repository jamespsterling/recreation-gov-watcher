const rp = require('request-promise-native');
const { IncomingWebhook } = require('@slack/webhook');
require('dotenv').config();

const baseUrl = 'https://www.recreation.gov';
const slackUrl = process.env.SLACK_WEBHOOK_URL;
const campgroundId = 232464;
const availDate = '2020-09-11T00:00:00Z';
const startDate = '2020-09-01T00:00:00.000Z';


/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event Event payload.
 * @param {!Object} context Metadata for the event.
 */
exports.checkSites = (event, context) => {

    const httpHdl = async (options) => {
      
      return await rp(options)
      .then((response) => {
        return JSON.parse(response);
      })
      .catch((err) => {
        console.error(err);
      });
    };

    const getSiteDetails = async () => {

        return httpHdl({
          uri: `${baseUrl}/api/camps/campgrounds/${campgroundId}`,
          method: 'GET',
        });
    };

    const getAvail = async () => {

        return httpHdl({
          uri: `${baseUrl}/api/camps/availability/campground/${campgroundId}/month?start_date=${startDate}`,
          method: 'GET',
        });
      };

      getSiteDetails().then((c) => {

        getAvail().then((d) => {

          for (var site in d.campsites) {
            if (d.campsites[site].availabilities[availDate] === 'Available') {

              const webhook = new IncomingWebhook(slackUrl);

              webhook.send({
                text: `Campsite <${baseUrl}/camping/campsites/${d.campsites[site].campsite_id}|${d.campsites[site].site}> ` + 
                      `available on ${availDate.substr(0, 10)} at ${c.campground.facility_name}`,
              });
            }
          }
        });
      });
};

this.checkSites();