function intent(sources) {
}

function model(intents) {
    
}

function view(models$) {
    
}

export default function player(sources) {
    return {
        DOM: view(model(intent(sources)))
    }
}
