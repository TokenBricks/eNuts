import EntryTime from '@screens/History/entryTime'
import { NS } from '@src/i18n'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'

interface ITransactionItemProps { 
    title: string;
    timestamp: number;
    amount: number;
}

export default function TransactionItem({ title, timestamp, amount }: ITransactionItemProps) {
	const { t } = useTranslation([NS.history])
	return (
		<View style={styles.item}>
			<View style={styles.content}>
				<View style={styles.textBox}>
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.subTitle}><EntryTime from={timestamp * 1000} fallback={t('justNow')} /></Text>
				</View>
				<Text style={[styles.amount,{color:amount>0? '#3A70FF':'#E45252'}]}>{ amount>0? '+':'-' }{amount}</Text>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	item: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-start',
		alignItems: 'flex-start',
		width: 361,
		height: 64,
		paddingLeft: 14,
		paddingRight: 14,
		paddingTop: 10,
		paddingBottom: 10,
		// borderWidth: 1,
		// borderColor: 'rgba(230,230,230,1)',
		borderRadius: 6,
		boxSizing: 'border-box',
		backgroundColor: 'rgba(255,255,255,0.05)',
	},
	content: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
		height: '100%',
		boxSizing: 'border-box',
	},
	textBox: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-start',
		alignItems: 'flex-start',
		height: '100%',
		marginRight: 94,
		boxSizing: 'border-box',
	},
	title: {
		// marginRight: 4,
		color: 'rgba(255,255,255,1)',
		fontSize: 16,
		// lineHeight: '125%',
		// fontFamily: 'Roboto, sans-serif',
		fontWeight: '400',
	},
	subTitle: {
		color: 'rgba(255,255,255,0.6)',
		fontSize: 14,
		// fontFamily: 'Roboto, sans-serif',
		fontWeight: '400',
		marginTop: 4,
	},
	amount: {
		fontSize: 16,
		// fontFamily: 'Roboto, sans-serif',
		fontWeight: '400',
	},
})
