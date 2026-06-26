exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "API key niet geconfigureerd" }) };
  }

  try {
    const body = JSON.parse(event.body);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: `Je bent een data-extractie-assistent. Analyseer de aangeleverde tekst (gespreksnotities of audiotranscript) en extraheer alle beschikbare informatie om onderstaand JSON-object in te vullen. Gebruik null voor velden die je niet kan afleiden. Antwoord UITSLUITEND met geldig JSON, geen uitleg, geen backticks.

Schema:
{
  "bedrijfsnaam": "string of null",
  "sector": "string of null",
  "contactpersoon": "string of null",
  "aantalMedewerkers": "number of null",
  "kostprijsPerUur": "number of null",
  "naamCoordinator": "string of null",
  "aantalMensenPerIncident": "number of null",
  "duurIncidentMinuten": "number of null",
  "frequentiePerWeek": "number of null",
  "nietGefactureerdMaand": "number of null",
  "adminUrenPerWeek": "number of null",
  "kostprijsCoordinatorPerUur": "number of null",
  "eenmaligeKosten": "number of null",
  "jaarlijkseLicentie": "number of null"
}`,
        messages: [{ role: "user", content: body.text }],
      }),
    });

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
