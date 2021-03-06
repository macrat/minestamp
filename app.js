const vm = new Vue({
	el: '#app',
	data() {
		const now = new Date();
		const key = `minestamp::${now.getFullYear()}-${('0' + now.getMonth()).slice(-2)}`;
		let records = localStorage.getItem(key);

		if (records) {
			records = JSON.parse(records).map(x => ({
				day: x.day,
				start: x.start ? new Date(x.start) : null,
				end: x.end ? new Date(x.end) : null,
				'break': x['break'].map(y => ({
					start: y.start ? new Date(y.start) : null,
					end: y.end ? new Date(y.end) : null,
				})),
			}));
		} else {
			records = [];
			for (let i=1; i<=new Date(now.getYear(), now.getMonth(), 0).getDate(); i++) {
				records.push({
					day: i,
					start: null,
					end: null,
					'break': [
						{start: null, end: null},
						{start: null, end: null},
						{start: null, end: null},
					],
				});
			}
		}

		return {
			storeKey: key,
			records: records,
		};
	},
	computed: {
		today() {
			return this.records[new Date().getDate() - 1];
		},
		state() {
			if (!this.today.start) {
				return 'before-attendance';
			} else if (this.today.end) {
				return 'after-work';
			}
			for (const b of this.today['break']) {
				if (b.start && !b.end) {
					return 'breaking';
				}
			}
			return 'working';
		},
		downloadURL() {
			const month = new Date().getMonth() + 1;
			const csv = [
				'日付, 出勤, 退勤, 休憩1 開始, 休憩1 終了, 休憩2 開始, 休憩2 終了, 休憩3 開始, 休憩3 終了,',
			].concat(this.records.map(row => [
				`${month}/${row.day}`,
				this.dateToStr(row.start),
				this.dateToStr(row.end),
			].concat(Array.prototype.concat.apply([], row.break.map(b => [
				this.dateToStr(b.start),
				this.dateToStr(b.end),
			]))).join(', ') + ',')).join('\n');

			return URL.createObjectURL(new Blob([csv], {type: 'text/plain'}));
		},
	},
	watch: {
		records: {
			deep: true,
			handler(val) {
				localStorage.setItem(this.storeKey, JSON.stringify(val));
			},
		},
	},
	methods: {
		startWork() {
			if (this.today.start) {
				alert('既に今日の出勤の記録があります');
			} else {
				this.today.start = new Date();
			}
		},
		endWork() {
			if (this.today.end) {
				alert('既に今日の退勤の記録があります');
			} else {
				this.today.end = new Date();
			}
		},
		startBreak() {
			for (let i=0; i<this.today['break'].length; i++) {
				if (!this.today['break'][i].start) {
					this.today['break'][i].start = new Date();
					return;
				}
			}
			alert('3回以上の休憩を記録することは出来ません');
		},
		endBreak() {
			for (let i=0; i<this.today['break'].length; i++) {
				if (!this.today['break'][i].end) {
					this.today['break'][i].end = new Date();
					return;
				}
			}
			alert('3回以上の休憩を記録することは出来ません');
		},
		dateToStr(date) {
			if (date) {
				return `${date.getHours()}:${('0' + date.getMinutes()).slice(-2)}`;
			} else {
				return '';
			}
		},
	},
});
