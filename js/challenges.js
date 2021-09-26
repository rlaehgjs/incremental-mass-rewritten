function setupChalHTML() {
    let chals_table = new Element("chals_table")
	let table = ""
	for (let x = 1; x <= CHALS.cols; x++) {
        table += `<div id="chal_div_${x}"><img id="chal_btn_${x}" onclick="player.chal.choosed = ${x}" class="img_chal" src="images/chal_${x}.png"><br><span id="chal_comp_${x}">X</span></div>`
	}
	chals_table.setHTML(table)
}

function updateChalHTML() {
    for (let x = 1; x <= CHALS.cols; x++) {
        let chal = CHALS[x]
        let unl = chal.unl ? chal.unl() : true
        tmp.el["chal_div_"+x].setDisplay(unl)
        tmp.el["chal_btn_"+x].setClasses({img_chal: true, ch: CHALS.inChal(x)})
        if (unl) {
            tmp.el["chal_comp_"+x].setTxt(format(player.chal.comps[x],0)+"/"+chal.max)
        }
    }
    tmp.el.chal_enter.setVisible(player.chal.active == 0)
    tmp.el.chal_exit.setVisible(player.chal.active != 0)
    tmp.el.chal_exit.setTxt(tmp.chal.canFinish ? "Finish Challenge for +"+tmp.chal.gain+" Completions" : "Exit Challenge")
    tmp.el.chal_desc_div.setDisplay(player.chal.choosed != 0)
    if (player.chal.choosed != 0) {
        let chal = CHALS[player.chal.choosed]
        tmp.el.chal_ch_title.setTxt(`[${player.chal.choosed}] ${chal.title} [${player.chal.comps[player.chal.choosed]+"/"+chal.max} Completions]`)
        tmp.el.chal_ch_desc.setTxt(chal.desc)
        tmp.el.chal_ch_goal.setTxt("Goal: "+CHALS.getFormat(player.chal.choosed)(tmp.chal.goal[player.chal.choosed]))
        tmp.el.chal_ch_reward.setTxt("Reward: "+chal.reward)
        tmp.el.chal_ch_eff.setTxt("Currently: "+chal.effDesc(tmp.chal.eff[player.chal.choosed]))
    }
}

function updateChalTemp() {
    if (!tmp.chal) tmp.chal = {
        goal: {},
        eff: {},
        bulk: E(0),
        canFinish: false,
        gain: E(0),
    }
    for (let x = 1; x <= CHALS.cols; x++) {
        let chal = CHALS[x]
        tmp.chal.goal[x] = chal.goal(player.chal.comps[x])
        tmp.chal.eff[x] = chal.effect(player.chal.comps[x])
    }
    tmp.chal.format = player.chal.active != 0 ? CHALS.getFormat() : format
    tmp.chal.bulk = player.chal.active != 0 ? CHALS[player.chal.active].bulk(CHALS.getResource(player.chal.active)) : E(0)
    tmp.chal.gain = player.chal.active != 0 ? tmp.chal.bulk.min(CHALS[player.chal.active].max).sub(player.chal.comps[player.chal.active]).max(0).floor() : E(0)
    tmp.chal.canFinish = player.chal.active != 0 ? tmp.chal.bulk.gt(player.chal.comps[player.chal.active]) : false
}

const CHALS = {
    inChal(x) { return player.chal.active == x },
    cols: 2,
    exit() {
        if (!player.chal.active == 0) {
            if (tmp.chal.canFinish) {
                player.chal.comps[player.chal.active] = player.chal.comps[player.chal.active].add(tmp.chal.gain)
            }
            player.chal.active = 0
            FORMS.bh.doReset()
        }
    },
    enter() {
        if (player.chal.active == 0) {
            player.chal.active = player.chal.choosed
            FORMS.bh.doReset()
        }
    },
    getResource(x) {
        return player.mass
    },
    getFormat(x) {
        return formatMass
    },
    1: {
        title: "Instant Scale",
        desc: "Super Ranks, Mass Upgrades starts at 25. In addtional, Super Tickspeed start at 50.",
        reward: `Super Ranks starts later, Super Tickspeed scaling weaker by completions.`,
        max: 100,
        goal(x) { return E(5).pow(x.pow(1.25)).mul(1.5e58) },
        bulk(x) {
            let b = x.div(1.5e58)
            if (b.lt(1)) return E(0)
            return b.log(5).root(1.25).add(1).floor()
        },
        effect(x) {
            let rank = x.softcap(20,4,1).floor()
            let tick = E(0.96).pow(x.root(2))
            return {rank: rank, tick: tick}
        },
        effDesc(x) { return "+"+format(x.rank,0)+" later to Super Ranks, Super Tickspeed scaling "+format(E(1).sub(x.tick).mul(100))+"% weaker" },
    },
    2: {
        unl() { return player.chal.comps[1].gte(1) },
        title: "Anti-Tickspeed",
        desc: "You cannot buy Tickspeed.",
        reward: `For every completions adds +7.5% to Tickspeed Power.`,
        max: 100,
        goal(x) { return E(10).pow(x.pow(1.25)).mul(1.989e40) },
        bulk(x) {
            let b = x.div(1.989e40)
            if (b.lt(1)) return E(0)
            return b.log10().root(1.25).add(1).floor()
        },
        effect(x) {
            let ret = x.mul(0.075)
            return ret
        },
        effDesc(x) { return "+"+format(x.mul(100))+"%" },
    },
}