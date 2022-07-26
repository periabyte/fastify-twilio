require("dotenv").config();
const fastify = require('fastify')({
    logger: true
});
const twilio = require('twilio');
const { VoiceResponse } = twilio.twiml;
const { AccessToken } = twilio.jwt;
const { VoiceGrant } = AccessToken;

const { PORT, ACCOUNT_SID, APP_SID, AUTH_TOKEN, TOKEN_SID, TOKEN_SECRET, HOST_NAME } = process.env;
// fastify body parser
fastify.register(require('@fastify/formbody'))

function isNumber(to) {
  if(to.length == 1) {
    if(!isNaN(to)) {
      console.log("It is a 1 digit long number" + to);
      return true;
    }
  } else if(String(to).charAt(0) == '+') {
    number = to.substring(1);
    if(!isNaN(number)) {
      console.log("It is a number " + to);
      return true;
    };
  } else {
    if(!isNaN(to)) {
      console.log("It is a number " + to);
      return true;
    }
  }
  console.log("not a number");
  return false;
}
const getToken = async (req, res) => {
  const { phoneNumber } = req.body;

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: APP_SID,
  });

  const token = new AccessToken(
    ACCOUNT_SID,
    TOKEN_SID,
    TOKEN_SECRET, {
    identity: phoneNumber
  }
  );
  token.addGrant(voiceGrant);

  res.send(token.toJwt());
};
// get access token 
fastify.get('/token', getToken);
fastify.post('/token', getToken);

fastify.post('/calls/update', async (request, reply) => {
    console.log(request.body);
   
    // const client = twilio(accountSid, authToken);
    // const call = await client.calls(sid).update({ status });

    // reply.send({
    //     call,
    // });
});

const placeCall = async (req, res) => {
    console.log('placeCall', req.body);
    const {
        to,
        from
    } = req.body;
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN);
    
    const call = await client.calls.create({
        url:  `${HOST_NAME}/incoming`,
        to,
        from,
    })

    res.send(call.sid);
};

function makeCall(request, response) {
    console.log('makeCall', request.body)
  // The recipient of the call, a phone number or a client
  let to = null;
  if (request.method == 'POST') {
    to = request.body.to || request.body.To;
  } else {
    to = request.query.to || request.query.To;
  }
  console.log('to', to)
  const voiceResponse = new VoiceResponse();

  

  if (!to) {
      voiceResponse.say("Congratulations! You have made your first call! Good bye.");
  } else if (isNumber(to)) {
      const dial = voiceResponse.connect();
    
    // voiceResponse.connect().room(`room-${to}-${request.body.from || request.query.from}`);
    dial.conference(to);  
  } else {
      const dial = voiceResponse.dial({callerId : callerId});
      dial.client(to);
  }

  console.log('Response:' + voiceResponse.toString());
  return response.send(voiceResponse.toString());
}

// make voice conference endpoint

fastify.get('/makeCall', makeCall);

fastify.post('/makeCall', makeCall);

fastify.get('/placeCall', placeCall);

fastify.post('/placeCall', placeCall);

fastify.get('/', async (request, reply) => {
  reply.send({
    message: 'Hello World!'
  });
});

fastify.get('/incoming', async (request, reply) => {
  const voiceResponse = new VoiceResponse();
  voiceResponse.say("Congratulations! You have received your first inbound call! Good bye.");
  console.log('Response:' + voiceResponse.toString());
  return response.send(voiceResponse.toString());
})
/**
 * Run the server!
 */
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || "3000", host: process.env.HOST || '0.0.0.0' })
  } catch (err) {
      console.log('err', err);
    process.exit(1)
  }
}
start()