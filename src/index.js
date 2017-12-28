import {run} from '@cycle/run'
import {div, label, input, form, button, makeDOMDriver} from '@cycle/dom'
import xs from 'xstream';
import serialize from 'form-serialize';

function intent(sources) {
    return {
        switchPlayer: sources.DOM.events('keydown', { preventDefault: e => 9 === e.keyCode }).filter(ev => 9 === ev.keyCode),
        addPlayer: sources.DOM.select('.new.player').events('submit', { preventDefault: true }).map(ev => serialize(ev.target, { hash: true })).filter(data => data.name),
        addScore: sources.DOM.select('.active.player input').events('keydown').filter(ev => 13 === ev.keyCode).map(ev => Number.parseInt(ev.target.value))
    };
}

function model(intents) {
    const addPlayer$ = intents.addPlayer.map(addPlayer => state => Object.assign({}, state, { players: [ ...state.players, {
        name: addPlayer.name,
        scores: []
    }] }));
    const switchPlayer$ = intents.switchPlayer.map(() => state => {
        let currentPlayer = 0;
        if (state.currentPlayer + 1 < state.players.length) {
            currentPlayer = state.currentPlayer + 1;
        }

        return Object.assign({}, state, { currentPlayer: currentPlayer });
    });
    const addScore$ = intents.addScore.map(score => state => {
        const currentPlayer = state.players[state.currentPlayer];
        if (0 === currentPlayer.scores.length) {
            currentPlayer.scores.unshift(score);
        } else {
            currentPlayer.scores.unshift(currentPlayer.scores[0] + score);
        }

        return Object.assign({}, state, {
            players: [
                ...state.players.slice(0, state.currentPlayer),
                currentPlayer,
                ...state.players.slice(state.currentPlayer + 1)
            ]
        });
    });

    const initialState = { players: [], currentPlayer: 0 };

    return xs.merge(addPlayer$, switchPlayer$, addScore$).fold((state, operation) => operation(state), initialState);
}

function view(models$) {
    return models$.map(state => {
        return div('.container', [
            ...state.players.map((player, index) => {
                const classes = ['player'];
                const child = [
                    div('.name', player.name),
                    ...player.scores.map((score, index) => {
                        let selector = '.score';
                        if (index > 0) {
                            selector = selector.concat('.previous');
                        }
                        return div(selector, score);
                    })
                ];
                if (index === state.currentPlayer) {
                    classes.push('active');
                    child.push(input({ attrs: { type: 'number', name: 'points' } }));
                }

                return div({ attrs: { class: classes.join(' ') } }, child);
            }),
            form('.new.player', [
                div('.name', [
                    input({ attrs: { type: 'text', name: 'name', placeholder: 'Nom' } }),
                ]),
                button({ attrs: { type: 'submit' } }, 'Ajouter')
            ])
        ]);
    });
}

function main(sources) {
    return {
        DOM: view(model(intent(sources)))
    }
}

run(main, { DOM: makeDOMDriver('#app') });
