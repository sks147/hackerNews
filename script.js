let counting = 0;
const nextButton = document.querySelector('#next');
const prevButton = document.querySelector('#prev');
const pagination = document.querySelector('.pagination');
const container = document.querySelector('#inner');
let current;
let next;
let previous;	
let loading = false;
let show = false;
let comments=[];

const getTop = async() =>{
	const res = await fetch('https://hacker-news.firebaseio.com/v0/newstories.json?print=pretty')
	const json1 = await res.json();
	return json1;
};

const render = async(jsonArray) =>{
	const HTML =  Promise.all(jsonArray.map(async(element, i) =>{
		const res2 = await fetch(`https://hacker-news.firebaseio.com/v0/item/${element}.json?print=pretty`);
		const item = await res2.json();
		console.log(item);
		if(item===null){
			return;
		}
		if(item.kids){
			return  `
				<section class="stories">
					<a href="${item.url}" style="text-decoration:none" >
						<h3>
							${item.title}
						</h3>
					</a>
					<p>
						By: ${item.by} at ${timeSince(item.time)} ago   Score: ${item.score} points
					</p>
					<button id="showComment-${element}" class = "commentsButton">Show Comments</button>
					<div id="comment-${element}">
					</div>
				</section>
			`;
		} else{
			return `
				<section class="stories">
					<a href="${item.url}" style="text-decoration:none" >
						<h3>
							${item.title}
						</h3>
					</a>
					<p>
						By: ${item.by} at ${timeSince(item.time)} ago Score: ${item.score} ${item.score>1?'points':'point'}
					</p>
					<p>
						There is no comments.
					</p>
				</section>
			`
		}	
	}));
	return HTML;
};

const addCommentsButton = async()=>{
	const buttonsDiv = document.querySelectorAll(".commentsButton");
	buttonsDiv.forEach( (button)=> {
		button.addEventListener('click', async function(){
			const commentID = this.id.split('-')[1];
			let item = await fetch(`https://hacker-news.firebaseio.com/v0/item/${commentID}.json?print=pretty`);
			item = await item.json();
			const commentDiv = document.querySelector(`#comment-${commentID}`);
			// if(!show){
			if(this.innerHTML === 'Show Comments'){	
				commentDiv.innerHTML = 'Please wait while we are loading the comments...';
				const HTML = await renderComments(item, -1);
				await printComments(HTML, commentDiv);
				this.innerHTML = 'Hide Comments';
				show = true;
			}else{
				commentDiv.innerHTML = '';
				this.innerHTML = 'Show Comments';
				show = false;
			}
		});
	});
};

const renderComments = async(parentElement, index)=>{
	index++;
	const kids = parentElement.kids;
	let HTML = [];
	for(let i = 0; i<kids.length; i++){
		let kidItem = await fetch(`https://hacker-news.firebaseio.com/v0/item/${kids[i]}.json?print=pretty`);
		kidItem = await kidItem.json();
		HTML.push(`<div class = "comment-${kids[i]}">
				<p class="comment-author">By: ${kidItem.by} at ${timeSince(kidItem.time)} ago</p>
				<p>${kidItem.text}</p>
				${kidItem.kids?`<div class = "comment-${kidItem.id} inner-comment inner-comment-${index%7}">${await renderComments(kidItem, index)}</div>`:``}
			</div>`);
	};
	return HTML.join('');
};

const printComments = async(HTML, commentDiv)=>{
	commentDiv.innerHTML = HTML;
};

const printTwenty = (json) =>{
	const HTML = json.join('');
	container.innerHTML = HTML;
	pagination.innerHTML = `Items ${counting+1} - ${counting+20} `;
};

const pageLoad = async()=>{
	const json = await getTop();
	current = json.slice(counting,20); 
	next = json.slice(counting+20, counting+40);
	current = await render(current);
	next = await render(next);
	printTwenty(current);
	await addCommentsButton();

	nextButton.addEventListener('click', async()=>{
		window.scrollTo(0,0);
		if(loading) {
			alert('Loading data, please try again');
			return;
		}
		counting += 20;
		if(counting >=20){
			prev.classList.remove('none');
		}
		printTwenty(next);
		await addCommentsButton();
		loading = true;
		previous = current;
		current = next;
		next = json.slice(counting+20, counting+40);
		next = await render(next);
		loading = false;
	});
	
	prevButton.addEventListener('click', async()=>{
		window.scrollTo(0,0);
		if(loading) {
			alert('Loading data, please try again');
			return;
		}
		counting -= 20;
		if(counting <20){
			prev.classList.add('none');
		}
		printTwenty(previous);
		await addCommentsButton();
		loading = true;
		next = current;
		current = previous;
		previous = json.slice(counting-20, counting);
		previous = await render(previous);
		loading = false
	});
};

window.addEventListener('load', pageLoad);

function timeSince(timeStamp) {
    var now = new Date();
    var secondsPast = (now.getTime()/1000 - timeStamp);
    if(secondsPast < 60){
      return parseInt(secondsPast) + 's';
    }
    if(secondsPast < 3600){
      return parseInt(secondsPast/60) + 'm';
    }
    if(secondsPast <= 86400){
      return parseInt(secondsPast/3600) + 'h';
    }
    if(secondsPast > 86400){
        day = timeStamp.getDate();
        month = timeStamp.toDateString().match(/ [a-zA-Z]*/)[0].replace(" ","");
        year = timeStamp.getFullYear() == now.getFullYear() ? "" :  " "+timeStamp.getFullYear();
        return day + " " + month + year;
    }
  }